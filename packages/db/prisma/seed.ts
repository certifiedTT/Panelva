import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up existing database records...");
  await prisma.comment.deleteMany({});
  await prisma.page.deleteMany({});
  await prisma.chapter.deleteMany({});
  await prisma.collaboration.deleteMany({});
  await prisma.series.deleteMany({});
  await prisma.creatorProfile.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Seeding users...");
  // 1. Seed administrative and creator users
  const masterAdmin = await prisma.user.create({
    data: {
      username: "notjud3",
      email: "notjud3@panelva.com",
      role: "MASTER_ADMIN",
      subscription: "PREMIUM",
      wCoinBalance: 9999,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      username: "TO30",
      email: "to30@panelva.com",
      role: "ADMIN",
      subscription: "PREMIUM",
      wCoinBalance: 5000,
    },
  });

  const creatorUser1 = await prisma.user.create({
    data: {
      username: "VillainWriter",
      email: "villain@panelva.com",
      role: "CREATOR",
      wCoinBalance: 1000,
    },
  });

  const creatorUser2 = await prisma.user.create({
    data: {
      username: "DuchessPen",
      email: "duchess@panelva.com",
      role: "CREATOR",
      wCoinBalance: 1000,
    },
  });

  const normalUser = await prisma.user.create({
    data: {
      username: "SoloReader",
      email: "reader@panelva.com",
      role: "USER",
      subscription: "PLUS",
      wCoinBalance: 200,
    },
  });

  console.log("Seeding creator profiles...");
  const profile1 = await prisma.creatorProfile.create({
    data: {
      userId: creatorUser1.id,
      type: "WRITER",
      penName: "VillainWriter",
      bio: "Creator of epic dark fantasy and raising villains.",
      portfolioUrl: "https://panelva.com/portfolio/villain",
      isVetted: true,
      monetized: true,
    },
  });

  const profile2 = await prisma.creatorProfile.create({
    data: {
      userId: creatorUser2.id,
      type: "NOVELIST",
      penName: "DuchessPen",
      bio: "Prose romance novelist extraordinaire.",
      portfolioUrl: "https://panelva.com/portfolio/duchess",
      isVetted: true,
      monetized: true,
    },
  });

  // Helper creators for default mock values
  const defaultCreatorUser = await prisma.user.create({
    data: {
      username: "LeeJehwan",
      email: "lee@panelva.com",
      role: "CREATOR",
    },
  });

  const defaultCreatorProfile = await prisma.creatorProfile.create({
    data: {
      userId: defaultCreatorUser.id,
      type: "ARTIST",
      penName: "Lee Jehwan",
      bio: "Illustrator and storyteller.",
      portfolioUrl: "https://panelva.com/portfolio/lee",
      isVetted: true,
    },
  });

  console.log("Seeding series, chapters, and comments...");

  // Series 1: Love Bites (Comic)
  const series1 = await prisma.series.create({
    data: {
      title: "Love Bites",
      description: "Step into a world of visual romance and sweet bloodthirsty bites, where secrets of vampires and humans intertwine in an unexpected sweet roommate setup.",
      coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=300&auto=format&fit=crop",
      genre: "Romance",
      type: "COMIC",
      status: "ONGOING",
      creatorId: defaultCreatorProfile.id,
      views: 3900000,
      likes: 390000,
    },
  });

  // Series 2: Star Catcher (Comic)
  const series2 = await prisma.series.create({
    data: {
      title: "Star Catcher",
      description: "Catching stars and chasing hearts in the dark night sky. A heartwarming story about astronomy students searching for cosmic connections.",
      coverUrl: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=300&auto=format&fit=crop",
      genre: "Romance",
      type: "COMIC",
      status: "ONGOING",
      creatorId: defaultCreatorProfile.id,
      views: 3000000,
      likes: 300000,
    },
  });

  // Series 3: Being Raised by Villains (Comic)
  const series3 = await prisma.series.create({
    data: {
      title: "Being Raised by Villains",
      description: "Reborn as a character destined for a tragic end, she gets adopted by the most notorious villain family. Can she survive and live a peaceful life?",
      coverUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=300&auto=format&fit=crop",
      genre: "Fantasy",
      type: "COMIC",
      status: "ONGOING",
      creatorId: profile1.id,
      views: 1200000,
      likes: 120000,
    },
  });

  // Series 4: Born to be the Grand Duchess (Novel)
  const series4 = await prisma.series.create({
    data: {
      title: "Born to be the Grand Duchess",
      description: "Reborn into royalty, she must claim her throne as the grand duchess, navigating waiting lists and premium splits.",
      coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop",
      genre: "Romance",
      type: "NOVEL",
      status: "ONGOING",
      creatorId: profile2.id,
      views: 5400000,
      likes: 549934,
    },
  });

  // Add chapters to Series 3 (Being Raised by Villains)
  for (let idx = 1; idx <= 5; idx++) {
    const isPremium = idx > 3;
    const isAd = idx === 3;
    
    const chapter = await prisma.chapter.create({
      data: {
        seriesId: series3.id,
        title: `Episode ${idx}: ${idx === 1 ? "Erasure" : idx === 2 ? "Confirmation" : idx === 3 ? "The First Scheme" : "When Light Falls"}`,
        chapterIndex: idx,
        tier: isPremium ? "PREMIUM" : isAd ? "AD_SUPPORTED" : "FREE",
        waitTierDropAt: isPremium ? new Date(Date.now() + 1000 * 3600 * 24 * 7) : null,
      },
    });

    // Seed comic pages
    for (let pIdx = 1; pIdx <= 4; pIdx++) {
      await prisma.page.create({
        data: {
          chapterId: chapter.id,
          pageIndex: pIdx,
          imageUrl: `https://picsum.photos/800/1200?random=${chapter.id}_${pIdx}`,
          width: 800,
          height: 1200,
        },
      });
    }

    // Seed priority comments for Chapter 2
    if (idx === 2) {
      await prisma.comment.create({
        data: {
          chapterId: chapter.id,
          userId: masterAdmin.id,
          content: "Absolute masterpiece! The artwork in this chapter is stunning.",
          priorityScore: 4,
        },
      });
      await prisma.comment.create({
        data: {
          chapterId: chapter.id,
          userId: creatorUser1.id,
          content: "Thank you all for reading! Episode 3 will drop next week.",
          priorityScore: 3,
        },
      });
      await prisma.comment.create({
        data: {
          chapterId: chapter.id,
          userId: normalUser.id,
          content: "Loving the pacing of the story so far!",
          priorityScore: 1,
        },
      });
    }
  }

  // Add chapters to Series 4 (Born to be the Grand Duchess)
  for (let idx = 1; idx <= 4; idx++) {
    const isPremium = idx > 2;
    
    await prisma.chapter.create({
      data: {
        seriesId: series4.id,
        title: `Chapter ${idx}: ${idx === 1 ? "Rebirth" : idx === 2 ? "The Royal Decree" : idx === 3 ? "Meeting the Duke" : "Whispers of War"}`,
        chapterIndex: idx,
        tier: isPremium ? "PREMIUM" : "FREE",
        waitTierDropAt: isPremium ? new Date(Date.now() + 1000 * 3600 * 24 * 3) : null,
        textContent: `This is the prose text content for Chapter ${idx} of Born to be the Grand Duchess. Reborn into a new life, the duchess had to quickly adapt to the high society protocols and the mysterious Duke who watched her every move from the shadows. "You will never find escape here," he whispered cold as ice, but she only smiled back, knowing she held the key to the empire's future.`,
      },
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
