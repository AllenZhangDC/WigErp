import { prisma } from "./src/lib/prisma";
import { compare } from "bcryptjs";

async function check() {
    const users = await prisma.user.findMany();
    console.log("Users:", users.map(u => ({ email: u.email, pass: u.password_hash })));

    if (users.length > 0) {
        const isMatch = await compare('Jingjin@2020', users[0].password_hash);
        console.log("Match for Jingjin@2020:", isMatch);
    }
}

check().catch(console.error).finally(() => process.exit(0));
