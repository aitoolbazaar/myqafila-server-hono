import { prisma } from "../../config/db.config";

export const handleGuestMergeOrSync = async (
  userId: string,
  guestIdTemp?: string | null,
) => {
  if (!guestIdTemp) {
    // If no guest ID is provided, just find the user's existing linked guest if any
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { linkedGuestId: true },
    });
    return user?.linkedGuestId || null;
  }

  // 1. Fetch the user and their existing linked guest (if any)
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return null;

  const masterGuestId = user.linkedGuestId;

  // Check if the temporary guest profile exists in the DB
  const tempGuest = await prisma.guest.findUnique({
    where: { guestId: guestIdTemp },
    include: { sessionData: true },
  });

  if (!tempGuest) {
    // Temporary guest doesn't exist or is already deleted. Return existing master or temp ID.
    return masterGuestId || guestIdTemp;
  }

  // If the user does not have an existing linked guest ID, this is Scenario 1: New Sign-Up Conversion.
  if (!masterGuestId) {
    try {
      // Link the temporary guest to the user
      await prisma.guest.update({
        where: { guestId: guestIdTemp },
        data: {
          isConverted: true,
          userId: user.id,
        },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { linkedGuestId: guestIdTemp },
      });

      // Merge UserStats
      const guestStats = await prisma.user_stats.findUnique({
        where: { entityId: guestIdTemp },
      });

      const userStats = await prisma.user_stats.findUnique({
        where: { entityId: user.id },
      });

      // Re-route visit logs safely to prevent unique constraint crashes
      const tempLogs = await prisma.user_stats.findMany({
        where: { entityId: guestIdTemp },
      });

      for (const log of tempLogs) {
        const existingLog = await prisma.user_stats.findUnique({
          where: {
            entityId_visitDate: {
              entityId: user.id,
              visitDate: log.visitDate,
            },
          },
        });

        if (existingLog) {
          await prisma.user_stats.update({
            where: { id: existingLog.id },
            data: {
              todayVisitCount:
                existingLog.todayVisitCount + log.todayVisitCount,
              lastCheckInTime: new Date(
                Math.max(
                  new Date(existingLog.lastCheckInTime).getTime(),
                  new Date(log.lastCheckInTime).getTime(),
                ),
              ),
            },
          });
        } else {
          await prisma.user_stats.create({
            data: {
              entityId: user.id,
              entityType: "USER",
              visitDate: log.visitDate,
              visitedDates: log.visitedDates,
              todayVisitCount: log.todayVisitCount,
              lastCheckInTime: log.lastCheckInTime,
            },
          });
        }
      }
    } catch (error) {
      console.error("⚠️ Failed to link/merge new guest with user:", error);
    }

    return guestIdTemp;
  }

  // If masterGuestId exists and differs from guestIdTemp, this is Scenario 2: Existing User Login on a new browser/session.
  if (masterGuestId !== guestIdTemp) {
    try {
      // 1. Overwrite/Sync session metadata from temp guest to master guest
      if (tempGuest.sessionData) {
        const {
          id,
          guestId,
          createdAt,
          updatedAt,
          ...sessionFields
        } = tempGuest.sessionData;
        await prisma.guest_session_data.upsert({
          where: { guestId: masterGuestId },
          update: sessionFields as any,
          create: {
            ...(sessionFields as any),
            guestId: masterGuestId,
          },
        });
      }

      // 2. Re-route temp logs to the master guest/user
      const tempLogs = await prisma.user_stats.findMany({
        where: { entityId: guestIdTemp },
      });

      for (const log of tempLogs) {
        // Since user is already logged in, check if log exists under userId
        const existingLog = await prisma.user_stats.findUnique({
          where: {
            entityId_visitDate: {
              entityId: user.id,
              visitDate: log.visitDate,
            },
          },
        });

        if (existingLog) {
          await prisma.user_stats.update({
            where: { id: existingLog.id },
            data: {
              todayVisitCount:
                existingLog.todayVisitCount + log.todayVisitCount,
              lastCheckInTime: new Date(
                Math.max(
                  new Date(existingLog.lastCheckInTime).getTime(),
                  new Date(log.lastCheckInTime).getTime(),
                ),
              ),
            },
          });
        } else {
          await prisma.user_stats.create({
            data: {
              entityId: user.id,
              entityType: "USER",
              visitDate: log.visitDate,
              visitedDates: log.visitedDates,
              todayVisitCount: log.todayVisitCount,
              lastCheckInTime: log.lastCheckInTime,
            },
          });
        }
      }

      // 3. Exploit Prevention: Discard tempGuest's UserStats (points, streak etc.)
      // Deleting tempGuest will automatically cascade delete its UserStats and SessionData
      await prisma.guest.delete({
        where: { guestId: guestIdTemp },
      });
    } catch (error) {
      console.error("⚠️ Failed to merge/sync existing guest session:", error);
    }
  }

  return masterGuestId;
};
