import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_PASSWORD = 'failsafe@123';

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Wipe existing users so re-seeding stays clean ───────────────────────
  await prisma.activityLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.pollVote.deleteMany();
  await prisma.pollOption.deleteMany();
  await prisma.poll.deleteMany();
  await prisma.rSVP.deleteMany();
  await prisma.user.deleteMany();

  // ─── Admin accounts ───────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const admins = [
    { email: 'ashutosh.choudhary@siemens.com', name: 'Ashutosh Choudhary' },
    { email: 'd.yashas@siemens.com',           name: 'Yashas D'           },
    { email: 'nagarjuna.kn@siemens.com',       name: 'Nagarjuna KN'       },
  ];

  for (const a of admins) {
    await prisma.user.create({
      data: {
        email: a.email.toLowerCase(),
        name: a.name,
        passwordHash: adminHash,
        role: 'ADMIN',
      },
    });
    console.log(`✅ Admin created: ${a.email}`);
  }

  // ─── Employee accounts (no password — must be set on first login) ─────────
  const employees = [
    { email: 'john.smith@siemens.com',    name: 'John Smith'    },
    { email: 'jane.doe@siemens.com',      name: 'Jane Doe'      },
    { email: 'bob.wilson@siemens.com',    name: 'Bob Wilson'    },
    { email: 'alice.johnson@siemens.com', name: 'Alice Johnson' },
    { email: 'charlie.brown@siemens.com', name: 'Charlie Brown' },
    { email: 'diana.prince@siemens.com',  name: 'Diana Prince'  },
    { email: 'evan.davis@siemens.com',    name: 'Evan Davis'    },
    { email: 'fiona.green@siemens.com',   name: 'Fiona Green'   },
    { email: 'george.miller@siemens.com', name: 'George Miller' },
    { email: 'hannah.white@siemens.com',  name: 'Hannah White'  },
  ];

  for (const emp of employees) {
    await prisma.user.create({
      data: {
        email: emp.email.toLowerCase(),
        name: emp.name,
        passwordHash: null,   // <── no password;  set on first login
        role: 'EMPLOYEE',

      },
    });
    console.log(`✅ Employee created (no password): ${emp.email}`);
  }

  // ─── Event config ──────────────────────────────────────────────────────────
  await prisma.eventConfig.upsert({
    where: { id: 'default-config' },
    update: {},
    create: {
      id: 'default-config',
      outingDate: new Date('2026-04-01T09:00:00.000Z'),
      venueName: 'Sunset Beach Resort',
      venueAddress: '123 Ocean Drive, Crystal Bay, CA 90210',
      description:
        'Join us for an amazing day of fun, food, and team bonding! ' +
        'Beach games, BBQ lunch, team challenges, and sunset dinner await. ' +
        'This is going to be the best team outing yet! 🎉🌴',
    },
  });
  console.log('✅ Event config created');

  // ─── Sample polls ─────────────────────────────────────────────────────────
  await prisma.poll.create({
    data: {
      question: 'What activity are you most excited about?',
      isActive: true,
      options: {
        create: [
          { text: '🏖️ Beach Volleyball'  },
          { text: '🎨 Team Art Workshop'  },
          { text: '🎮 Gaming Tournament'  },
          { text: '🧘 Yoga & Wellness'    },
          { text: '🍳 Cooking Challenge'  },
        ],
      },
    },
  });

  await prisma.poll.create({
    data: {
      question: 'What cuisine should we have for lunch?',
      isActive: true,
      options: {
        create: [
          { text: '🍔 BBQ & Grill'    },
          { text: '🍕 Italian'        },
          { text: '🍣 Japanese'       },
          { text: '🌮 Mexican'        },
          { text: '🥗 Healthy/Vegan'  },
        ],
      },
    },
  });
  console.log('✅ Polls created');

  console.log('\n🎉 Seed complete!');
  console.log('─────────────────────────────────────────────────');
  console.log('ADMIN logins   → password: failsafe@123');
  console.log('  ashutosh.choudhary@siemens.com');
  console.log('  d.yashas@siemens.com');
  console.log('  nagarjuna.kn@siemens.com');
  console.log('─────────────────────────────────────────────────');
  console.log('EMPLOYEE logins → must SET password on first login');
  console.log('  e.g.  john.smith@siemens.com');
  console.log('─────────────────────────────────────────────────');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
