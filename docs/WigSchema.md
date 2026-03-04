# Wig-ERP 数据库设计文档 v4

> 最后更新：2026-03-04  
> 数据库：PostgreSQL @ 198.46.216.210 / WigErp  
> Migrations：`v2_redesign` → `v3_improvements` → `v3_fk_fixes` → `v4_customer_address`

---

## 一、整体结构总览

```
──────────────────────────────────────────────────────────
 LEVEL 1  基础资料表（支持软删除）
──────────────────────────────────────────────────────────
 suppliers          供应商
 users              操作员 / 系统用户
 products           产品款式
 └── variants       SKU规格（库存最小单位）
 customers          客户（含等级 tier）
 └── addresses      客户收货地址（多地址）
 stock_locations    仓位（主仓 / 次品区 / 待退货区）
 stock_batches      进货批次

──────────────────────────────────────────────────────────
 LEVEL 2  财务与库存账本（严禁删除）
──────────────────────────────────────────────────────────
 stock_transactions 出入库流水 ← 核心库存账本
 payment_logs       收款流水   ← 核心财务账本
 orders             销售订单（含 address_id + shipping_snapshot）
 └── order_items    订单明细

──────────────────────────────────────────────────────────
 辅助表
──────────────────────────────────────────────────────────
 tier_prices        多级价格矩阵（SKU × 客户等级 → 价格）
 audit_logs         操作日志（记录基础资料的所有变更）
```

---

## 二、软删除策略

### 两级删除规则

| 级别 | 表 | 策略 |
|---|---|---|
| **Level 1** | suppliers, users, products, variants, customers, stock_locations, stock_batches, orders | **软删除**：设置 `deleted_at = now()`，数据永久保留 |
| **Level 2** | stock_transactions, payment_logs, order_items | **严禁删除**：错误只能用反向流水修正 |

### Partial Unique Index（软删除唯一约束解决方案）

> **问题**：删除 SKU `BW-18-613-BW` 后（`deleted_at` 非空），重新创建同名 SKU 会触发唯一约束冲突。  
> **解决**：所有唯一字段改用 **Partial Unique Index**，约束只对 `deleted_at IS NULL` 的有效记录生效。

```sql
-- 示例：variants.sku 的 Partial Unique Index
CREATE UNIQUE INDEX idx_variants_sku_active
  ON variants(sku)
  WHERE (deleted_at IS NULL);
```

已建立 Partial Unique Index 的字段：

| 表 | 字段 | 备注 |
|---|---|---|
| `variants` | `sku` | 主要唯一标识 |
| `variants` | `barcode` | 同时排除 NULL 值 |
| `products` | `slug` | URL 唯一标识 |
| `customers` | `email` | 同时排除 NULL 值 |
| `users` | `email` | 登录凭证 |
| `stock_locations` | `code` | 仓位代号 |
| `stock_batches` | `batch_no` | 批次号 |
| `orders` | `order_no` | 单号 |

> ⚠️ **注意**：因为这些字段无 `@unique`，Prisma 的 `upsert` 必须用 `id` 作为 `where` 条件，查找时用 `findFirst` + `deleted_at: null` 过滤。

---

## 三、枚举 (Enums)

### `material_type` — 材质
| 值 | 含义 |
|---|---|
| `human_hair` | 真人发 |
| `synthetic` | 化纤发 |

---

### `craft_type` — 制作工艺
| 值 | 含义 |
|---|---|
| `lace_front` | 正面蕾丝（13×4 / 13×6） |
| `full_lace` | 全蕾丝头套 |
| `machine_made` | 机制发套 |
| `three_sixty_lace` | 360° 蕾丝 |
| `u_part` | U型分区头套 |

---

### `curl_pattern` — 曲度
| 值 | 含义 |
|---|---|
| `straight` | 直发 |
| `body_wave` | 大波浪 |
| `deep_wave` | 深波 |
| `curly` | 卷发 |
| `kinky_curly` | 非洲小卷 |
| `water_wave` | 水波 |
| `loose_wave` | 松散波浪 |

---

### `price_mode` — 计价方式
| 值 | 含义 | subtotal 计算 |
|---|---|---|
| `per_piece` | 按件（默认） | `quantity × unit_price` |
| `by_weight` | 按克重 | `weight_actual × unit_price`（实发克重） |

> 按重计价时，`OrderItem.weight_actual` 为必填（实际称重可能≠理论克重）。

---

### `quality_status` — 货品质量
> 用于 `stock_transactions.quality_status`，决定影响哪个库存缓存字段

| 值 | 含义 | 影响字段 |
|---|---|---|
| `good` | 良品，可直接销售 | `variant.stock` |
| `needs_repair` | 待打理（退货未整理） | 不计入可售，存次品区 |
| `defective` | 次品 / 报废 | `variant.defective_stock` |

---

### `tx_type` — 出入库业务类型
| 值 | 方向 | 含义 |
|---|---|---|
| `purchase_in` | ＋ | 采购入库 |
| `sale_out` | － | 销售出库 |
| `return_in` | ＋ | 客户退货入库（销退） |
| `return_out` | － | 退给供应商（退供） |
| `loss` | － | 损耗（损坏、丢失） |
| `adjustment` | ± | 盘点调整（手工修正） |
| `transfer_in` | ＋ | 仓位调拨入（如次品修好→主仓） |
| `transfer_out` | － | 仓位调拨出（如移往次品区） |

---

### `order_status` — 订单状态
| 值 | 含义 |
|---|---|
| `pending` | 待处理 |
| `processing` | 处理中（备货中） |
| `completed` | 已完成（全款+全发货） |
| `cancelled` | 已取消 |

---

### `shipping_status` — 发货状态（独立于订单状态）
| 值 | 含义 | 判断条件 |
|---|---|---|
| `unshipped` | 未发货 | 所有 `order_items.shipped_quantity == 0` |
| `partial` | 部分发货 | 部分行 `shipped_quantity < quantity` |
| `shipped` | 全部发货 | 所有行 `shipped_quantity == quantity` |

---

### `payment_type` — 收款类型（支持预付款场景）
| 值 | 含义 | 典型场景 |
|---|---|---|
| `deposit` | 定金 / 预付款 | 客户先付 30%，货备好再付尾款 |
| `final` | 尾款 | 配合 deposit 使用 |
| `full` | 全款一次付清（默认） | 小额订单 |
| `refund` | 退款给客户 | 退货后退款，amount 为负 |
| `other` | 其他 | — |

---

### `payment_method` — 支付方式
| 值 | 含义 |
|---|---|
| `cash` | 现金 |
| `bank_transfer` | 银行电汇（默认） |
| `wechat_pay` | 微信支付 |
| `paypal` | PayPal |
| `stripe` | Stripe（信用卡） |
| `other` | 其他 |

---

### `customer_tier` — 客户等级（驱动多级定价）
| 值 | 含义 | 参考折扣 |
|---|---|---|
| `retail` | 散客 / 零售 | 无折扣（fallback 到 `wholesale_price`） |
| `vip` | VIP 常客 | ≈ 92 折 |
| `vvip` | 大批发商 | ≈ 85 折 |
| `agent` | 代理商 | ≈ 78 折（或独立协议价） |

---

### `cap_size` — 网帽尺寸
`petite` / `small` / `medium` / `large` / `xlarge`

---

### `user_role` — 系统角色
| 值 | 权限范围 |
|---|---|
| `admin` | 全权限 |
| `manager` | 可查财务、审批，不可删除基础资料 |
| `warehouse` | 仅扫码 + 出入库操作 |

---

### `audit_action` — 操作日志动作
`create` / `update` / `delete`（软删除也记录为 delete）

---

## 四、数据模型详解

---

### `suppliers` — 供应商 [L1]
| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | String (cuid) | 主键 |
| `name` | String | 供应商名称 |
| `contact` | String? | 联系方式 |
| `country` | String? | 国家 |
| `note` | String? | 备注 |
| `deleted_at` | DateTime? | 软删除时间戳 |

---

### `users` — 操作员 [L1]
| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | String | 主键 |
| `name` | String | 姓名 |
| `email` | String | 登录邮箱（partial unique: active only） |
| `password_hash` | String | bcrypt 密码哈希 |
| `role` | UserRole | 角色权限 |
| `deleted_at` | DateTime? | 软删除（离职员工保留操作历史） |

---

### `products` — 产品款式 [L1]
| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | String | 主键 |
| `name` | String | 产品名称 |
| `slug` | String | URL 标识（partial unique: active only） |
| `material` | MaterialType | 材质 |
| `craft` | CraftType | 工艺 |
| `category` | String? | 分类标签 |
| `images` | String[] | 多图数组（主图、细节图、网帽内部等） |
| `description` | String? | 描述 |
| `price_mode` | PriceMode | 计价方式（影响 OrderItem 计算逻辑） |
| `deleted_at` | DateTime? | 软删除 |

---

### `variants` — SKU规格 [L1] ⭐核心表

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | String | 主键 |
| `sku` | String | SKU 编码（partial unique: active only） |
| `product_id` | String | 关联产品 |
| **三维属性** | | |
| `length` | Decimal(5,1) | 长度（英寸）支持 18.5" |
| `color` | String | 色号 e.g. `#1B`, `#613`, `#4/27` |
| `curl` | CurlPattern | 曲度 |
| **假发特色** | | |
| `density` | Int? | 密度 % e.g. 150 / 180 / 250 |
| `cap_size` | CapSize? | 网帽尺寸 |
| **仓库实操** | | |
| `shelf_no` | String? | 货架位 e.g. `A1-04`（仓库员拣货导航） |
| **库存缓存（三层）** | | |
| `stock` | Int | 良品现货（可销售数量） |
| `reserved_stock` | Int | 锁定库存（已下单未发，防超卖） |
| `defective_stock` | Int | 次品库存 |
| **定价** | | |
| `cost_price` | Decimal(12,2) | 进货价 |
| `wholesale_price` | Decimal(12,2) | 默认批发价（retail tier fallback） |
| `weight_grams` | Int? | 理论克重（by_weight 计价参考） |
| `barcode` | String? | 条码（partial unique: active only） |
| `images` | String[] | SKU 多图（多视角、颜色细节） |
| `deleted_at` | DateTime? | 软删除（有订单历史绝不物理删除） |

#### 库存三层缓存说明

```
可销售 = stock - reserved_stock

下单流程：
  下单时  reserved_stock += quantity          ← 锁定防超卖
  发货时  stock -= quantity                   ← 实际扣减
         reserved_stock -= quantity           ← 解锁

取消订单：⚠️ 高频 Bug 点！
  必须执行  reserved_stock -= quantity        ← 否则锁定库存永不释放

退货流程（良品）：stock += 1
退货流程（次品）：defective_stock += 1

盘点对账：
  真实库存 = SUM(stock_transactions.quantity WHERE variant_id = X)
  差异 = 真实库存 - variant.stock
  若差异 ≠ 0 → 创建 tx_type=adjustment 流水修正
```

#### 价格查询优先级

```
1. 查 tier_prices WHERE variant_id=X AND tier=customer.tier AND deleted_at IS NULL
2. 若无记录 → fallback 到 variant.wholesale_price
```

#### 条码自动生成规则（应用层）

```
格式：{产品前缀}-{length}-{color_code}-{curl_abbr}
例：  BW-18-613-BW

应用层函数 generateBarcode(sku) 在 src/lib/sku-generator.ts 中实现
```

---

### `stock_locations` — 仓位 [L1]
| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | String | 主键 |
| `code` | String | 仓位代号（partial unique: active only） |
| `name` | String | 显示名称 |
| `description` | String? | 描述 |
| `deleted_at` | DateTime? | 软删除 |

**预设仓位**：

| code | 用途 |
|---|---|
| `MAIN` | 主仓库（良品成品） |
| `DEFECTIVE` | 次品区 |
| `PENDING-RETURN` | 待退货区（退回待验货） |

---

### `stock_batches` — 进货批次 [L1]
| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | String | 主键 |
| `batch_no` | String | 批次号（partial unique: active only） |
| `supplier_id` | String? | 来源供应商 |
| `note` | String? | 备注（如：色泽偏暖，注意与上批区分） |
| `received_at` | DateTime | 入库日期 |
| `deleted_at` | DateTime? | 软删除 |

---

### `stock_transactions` — 出入库流水 [L2] ⭐账本核心 严禁删除

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | String | 主键 |
| `variant_id` | String | 操作的 SKU |
| `tx_type` | TxType | 业务类型 |
| `quantity` | Int | **正数=入库，负数=出库** |
| `quality_status` | QualityStatus | 货品质量（影响哪个缓存字段） |
| `location_id` | String? | 操作仓位 |
| `batch_id` | String? | 关联批次（采购入库时填） |
| `remark` | String? | 备注 |
| `operator_id` | String | 操作人（追溯责任） |
| `order_id` | String? | 关联订单（订单删除时 SET NULL，流水不消失） |
| `created_at` | DateTime | 操作时间（不可修改） |

> **onDelete: SetNull** — 即使订单被误删，流水记录保留，`order_id` 置为 NULL。  
> 库存总量 = `SUM(quantity)` 恒等于 `variant.stock`（定期对账验证）。

---

### `customers` — 客户 [L1]
| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | String | 主键 |
| **姓名体系** | | |
| `display_name` | String | **必填**，系统列表/打印/邮件抬头显示名 |
| `company_name` | String? | 公司/店名，如 `Beauty Store NYC LLC` |
| `first_name` | String? | 联系人名，如 `Janet`（营销邮件用） |
| `last_name` | String? | 联系人姓，如 `Williams` |
| **联系方式** | | |
| `phone` | String? | 主要联系方式（WhatsApp / 电话） |
| `email` | String? | 邮箱（partial unique: active only） |
| `country` | String? | 客户所在国（税务/对账用） |
| **商业条款** | | |
| `tier` | CustomerTier | 客户等级（驱动 TierPrice 查价） |
| `credit_days` | Int | 账期天数（0=现款） |
| `credit_limit` | Decimal(12,2)? | 信用额度上限 |
| `receivable_amt` | Decimal(12,2) | 应收账款余额（缓存，真实账看 payment_logs） |
| `deleted_at` | DateTime? | 软删除 |

**display_name 填写规则**：
```
有公司名 → display_name = company_name  ("Beauty Store NYC")
无公司名 → display_name = first_name + " " + last_name  ("Sarah Johnson")
```

**营销自动化示例**：
```
发邮件抬头："Happy New Year, {first_name}!"  → "Happy New Year, Janet!"
系统列表显示：{display_name}               → "Beauty Store NYC"
出货单收件人：{recipient_name}（来自 Address 表）
```

---

### `addresses` — 客户收货地址 [L1]
> 一个客户可以有多个收货点（不同门店、仓库、工作室），下单时从地址簿选择。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | String | 主键 |
| `customer_id` | String | 所属客户 |
| `label` | String? | 地址标签，如 `Manhattan Store`、`Middletown Studio` |
| **收件人** | | |
| `recipient_name` | String? | 收件人姓名（可与客户本人不同，如仓库管理员） |
| `phone` | String? | 收件人联系电话 |
| **地址** | | |
| `address_line1` | String | 街道/门牌号 |
| `address_line2` | String? | 公寓/楼层/Suite |
| `city` | String | 城市 |
| `state` | String? | 州/省 |
| `zip` | String? | 邮编 |
| `country` | String | 国家（默认 `US`） |
| `is_default` | Boolean | 是否为默认发货地址 |
| `deleted_at` | DateTime? | 软删除 |

**多地址示例**：
```
cust-001 "Beauty Store NYC" 的地址:
  addr-001-main:   label="Main Store"       → 123 West 125th St, New York NY 10027
  addr-001-branch: label="Midtown Warehouse" → 456 7th Ave Suite 800, New York NY 10001
```

---

### `orders` — 销售订单 [L1/L2混合] *(新增地址关联)*
| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | String | 主键 |
| `order_no` | String | 单号（partial unique: active only） |
| `customer_id` | String | 客户 |
| `address_id` | String? | **发货地址**（从客户地址簿选择，可为空） |
| `shipping_snapshot` | Json? | **地址快照**（下单时锁定，防止地址修改影响历史） |
| `status` | OrderStatus | 订单状态 |
| `shipping_status` | ShippingStatus | 发货状态（独立跟踪） |
| `total_amount` | Decimal(12,2) | 总金额 |
| `paid_amount` | Decimal(12,2) | 已收款（缓存，真实看 payment_logs） |
| `deleted_at` | DateTime? | 软删除 |

**地址快照设计**：
```typescript
// 下单时写入 shipping_snapshot，地址被删除后仍可查看历史
shipping_snapshot = {
  label:          "Main Store",
  recipient_name: "Janet Williams",
  phone:          "+1-212-555-0100",
  address_line1:  "123 West 125th St",
  city:           "New York",
  state:          "NY",
  zip:            "10027",
  country:        "US"
}
```

---

### `payment_logs` — 收款流水 [L2] ⭐财务核心 严禁删除

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | String | 主键 |
| `customer_id` | String | 收款客户 |
| `order_id` | String? | 关联订单（可为空，客户一次还多张单）|
| `amount` | Decimal(12,2) | 收款金额（退款时为负数） |
| `payment_type` | PaymentType | 定金 / 尾款 / 全款 / 退款 |
| `payment_method` | PaymentMethod | 支付方式 |
| `note` | String? | 备注 |
| `operator_id` | String | 收款操作人 |
| `created_at` | DateTime | 收款时间 |

**预付款场景示例**：
```
订单 $10,000：
  PaymentLog #1: amount=3000, payment_type=deposit  ← 定金 30%
  PaymentLog #2: amount=7000, payment_type=final    ← 发货后收尾款
  customer.receivable_amt: 10000 → 7000 → 0
```

---

### `orders` — 销售订单 [L1/L2混合]
| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | String | 主键 |
| `order_no` | String | 单号（partial unique: active only） |
| `customer_id` | String | 客户 |
| `status` | OrderStatus | 订单状态 |
| `shipping_status` | ShippingStatus | 发货状态（独立跟踪） |
| `total_amount` | Decimal(12,2) | 总金额 |
| `paid_amount` | Decimal(12,2) | 已收款（缓存，真实看 payment_logs） |
| `deleted_at` | DateTime? | 软删除（删除后 stock_transactions.order_id SET NULL） |

---

### `order_items` — 订单明细 [L2]
| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | String | 主键 |
| `order_id` | String | 所属订单（Order 删除时 Cascade） |
| `variant_id` | String | SKU |
| `quantity` | Int | 下单数量 |
| `shipped_quantity` | Int | 已发货数量 |
| `weight_actual` | Decimal(8,3)? | 实际克重（`by_weight` 计价时必填，单位：克） |
| `unit_price` | Decimal(12,2) | 成交价（下单时锁定，历史价格保护） |
| `subtotal` | Decimal(12,2) | 小计 |

**subtotal 计算规则**：
```
per_piece: subtotal = quantity      × unit_price
by_weight: subtotal = weight_actual × unit_price  （实发克重，≠ 理论克重）
```

---

### `tier_prices` — 多级价格矩阵
| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | String | 主键 |
| `variant_id` | String | SKU |
| `tier` | CustomerTier | 客户等级 |
| `price` | Decimal(12,2) | 该等级价格 |
| `effective_from` | DateTime | 生效时间 |
| `effective_to` | DateTime? | 失效时间（null=永久有效） |

**唯一约束**：`@@unique([variant_id, tier])` — 每个 SKU 对每个等级只有一条当前价格。

---

### `audit_logs` — 操作日志
| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | String | 主键 |
| `table_name` | String | 被操作的表名 e.g. `variants` |
| `record_id` | String | 被操作记录的 id |
| `action` | AuditAction | create / update / delete |
| `old_values` | Json? | 变更前字段快照 |
| `new_values` | Json? | 变更后字段快照 |
| `operator_id` | String? | 操作人（可为空：系统自动操作） |
| `ip_address` | String? | 操作者 IP |
| `created_at` | DateTime | 操作时间 |

> 仅记录 Level 1 表的变更。Level 2 账本表本身即是日志，不重复记录。  
> 使用 Server Action 中间件统一写入，不需要手动调用。

---

## 五、关键业务流程

### A. 采购入库
```
1. 创建/选择 StockBatch（batch_no, supplier_id）
2. FOR EACH variant:
   stock_transactions.create(tx_type=purchase_in, quantity=+N,
     quality_status=good, batch_id, location_id=MAIN, operator_id)
   variant.stock += N
```

### B. 销售出库（含锁定库存防超卖）
```
下单时：
  variant.reserved_stock += quantity     ← 锁定（防止其他人下单超卖）

发货时：
  stock_transactions.create(tx_type=sale_out, quantity=-N, order_id)
  variant.stock -= N
  variant.reserved_stock -= N
  order_item.shipped_quantity += N
  → 更新 order.shipping_status

收款时：
  payment_logs.create(amount, payment_type, payment_method)
  customer.receivable_amt -= amount
  order.paid_amount += amount
```

### C. 取消订单 ⚠️ 高频 Bug 点

```
⚠️ 取消时必须回滚 reserved_stock，否则锁库存永不释放！

order.status = cancelled
FOR EACH order_item WHERE shipped_quantity < quantity:
  variant.reserved_stock -= (quantity - shipped_quantity)  ← 必须执行！
```

### D. 客退处理（良品 vs 次品分流）
```
退回良品：
  stock_transactions.create(tx_type=return_in, quality_status=good,
    location_id=MAIN, order_id)
  variant.stock += 1

退回次品：
  stock_transactions.create(tx_type=return_in, quality_status=defective,
    location_id=DEFECTIVE, order_id)
  variant.defective_stock += 1

如需退款：
  payment_logs.create(amount=-退款额, payment_type=refund)
  customer.receivable_amt += 退款额  （或直接退款给客户）
```

### E. 次品修复（调拨回主仓）
```
stock_transactions.create(tx_type=transfer_out, location_id=DEFECTIVE,
  quantity=-1, quality_status=defective)
variant.defective_stock -= 1

stock_transactions.create(tx_type=transfer_in, location_id=MAIN,
  quantity=+1, quality_status=good)
variant.stock += 1
```

### F. 盘点对账
```
真实库存 = SUM(stock_transactions.quantity) WHERE variant_id = X
期望库存 = variant.stock
差异 = 真实 - 期望

若差异 ≠ 0：
  stock_transactions.create(tx_type=adjustment, quantity=差异,
    remark="盘点调整", operator_id)
  variant.stock = 真实库存
```

---

## 六、已确认不支持 / 未来扩展

| 功能 | 决策 |
|---|---|
| 多仓库（多城市） | ❌ 不支持 |
| 多币种 / 汇率 | ❌ 不支持 |
| 出库单 / 装箱单 | ❌ 不支持（`shipping_status` + `shipped_quantity` 足够） |
| 微信 / WhatsApp 通知 | ❌ 不支持 |
| **预付款 / 定金** | ✅ 已支持（`payment_type = deposit/final`） |
| **条码自动生成** | ✅ 应用层 `sku-generator.ts` 实现 |
| **操作日志** | ✅ `audit_logs` 表，Server Action 中间件统一写入 |
| 多图支持 | ✅ `images String[]` 数组 |
| 货架定位 | ✅ `variants.shelf_no` e.g. `A1-04` |
| 按重计价 | ✅ `order_items.weight_actual` |
