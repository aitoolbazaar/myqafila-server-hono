import { prisma } from "../../config/db.config";

export interface SyncGuestInput {
  guestId: string;
  deviceInfo: any;
  userId: string | null;
  ip: string;
}

export interface GetUserDailyStatusInput {
  guestId?: string;
  userId: string | null;
}

export class GuestService {
  static async syncGuestService({
    guestId,
    deviceInfo,
    userId,
    ip,
  }: SyncGuestInput) {
    const todayStr = new Date().toISOString().split("T")[0]!;
    const now = new Date();
    let activeGuestId = guestId;

    // --- 1. SESSION SYNC & MERGE ON THE FLY ---
    if (userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { linkedGuestId: true },
        });

        if (user && user.linkedGuestId && user.linkedGuestId !== guestId) {
          const masterGuestId = user.linkedGuestId;

          const tempGuest = await prisma.guest.findUnique({
            where: { guestId: guestId },
            include: { sessionData: true },
          });

          if (tempGuest) {
            if (tempGuest.sessionData) {
              const {
                id,
                guestId: _,
                createdAt,
                updatedAt,
                ...sessionFields
              } = tempGuest.sessionData;
              await prisma.guest_session_data.upsert({
                where: { guestId: masterGuestId },
                update: sessionFields,
                create: {
                  ...sessionFields,
                  guestId: masterGuestId,
                },
              });
            }

            const tempLogs = await prisma.user_stats.findMany({
              where: { entityId: guestId },
            });

             for (const log of tempLogs) {
              const existingLog = await prisma.user_stats.findUnique({
                where: {
                  entityId_visitDate: {
                    entityId: userId,
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
                    entityId: userId,
                    entityType: "USER",
                    visitDate: log.visitDate,
                    visitedDates: log.visitedDates,
                    todayVisitCount: log.todayVisitCount,
                    lastCheckInTime: log.lastCheckInTime,
                  },
                });
              }
            }

            await prisma.guest.delete({
              where: { guestId: guestId },
            });
          }

          activeGuestId = masterGuestId;
        }
      } catch (error) {
        console.error(
          "⚠️ Failed to merge/sync existing guest session in syncGuestService:",
          error,
        );
      }
    }

    // --- 2. GEO_LOCATION FETCHING ---
    let geo: any = {};
    if (ip !== "::1" && ip !== "127.0.0.1" && ip !== "localhost") {
      try {
        const geoRes = await fetch(
          `https://api.ipinfo.io/lite/${ip}?token=${process.env.IPINFO_TOKEN}`,
        );
        if (geoRes.ok) {
          const geoData: any = await geoRes.json();
          geo = {
            countryName: geoData.country || "Unknown",
            countryCode: geoData.country_code || "Unknown",
            region: geoData.region || "Unknown",
            city: geoData.city || "Unknown",
            timezone: geoData.timezone || "Unknown",
            isp: geoData.org || "Unknown",
            asn: geoData.asn || "Unknown",
            asName: geoData.as_name || "Unknown",
            asDomain: geoData.as_domain || "Unknown",
            continentCode: geoData.continent_code || "Unknown",
            continentName: geoData.continent || "Unknown",
            latitude: geoData.latitude || "Unknown",
            longitude: geoData.longitude || "Unknown",
            postal: geoData.postal || "Unknown",
            state: geoData.state || "Unknown",
          };
        }
      } catch (err: any) {
        console.error("❌ Geo Fetch Failed in Service:", err.message);
      }
    }

    // --- 3. PREPARE IDENTITIES ---
    const primaryId = userId || activeGuestId;
    const entityType = userId ? "USER" : "GUEST";
    const isUser = !!userId;
    let pointsAwarded = Number(process.env.GUEST_MERGED) || 0;

    // --- 4. STAGE 1: Guest Table Logging ---
    await prisma.guest.upsert({
      where: { guestId: activeGuestId },
      update: {
        isConverted: isUser,
        userId: userId || null,
      },
      create: {
        guestId: activeGuestId,
        isConverted: isUser,
        userId: userId || null,
      },
    });

    // --- 5. STAGE 1.5: Heavy Metadata Table ---
    await prisma.guest_session_data.upsert({
      where: { guestId: activeGuestId },
      update: {
        countryName: geo.countryName,
        countryCode: geo.countryCode,
        region: geo.region,
        city: geo.city,
        timezone: geo.timezone,
        isp: geo.isp,
        asn: geo.asn,
        asName: geo.asName,
        asDomain: geo.asDomain,
        continentCode: geo.continentCode,
        continentName: geo.continentName,
        latitude: geo.latitude,
        longitude: geo.longitude,
        postal: geo.postal,
        state: geo.state,
        isMobile: deviceInfo?.device?.isMobile || false,
        isMobileOnly: deviceInfo?.device?.isMobileOnly || false,
        isTablet: deviceInfo?.device?.isTablet || false,
        isDesktop: deviceInfo?.device?.isDesktop || false,
        deviceType: deviceInfo?.device?.deviceType || "Unknown",
        mobileVendor: deviceInfo?.device?.mobileVendor || "Unknown",
        mobileModel: deviceInfo?.device?.mobileModel || "Unknown",
        isAndroid: deviceInfo?.os?.isAndroid || false,
        isIOS: deviceInfo?.os?.isIOS || false,
        isWindows: deviceInfo?.os?.isWindows || false,
        isMacOs: deviceInfo?.os?.isMacOs || false,
        osVersion: String(deviceInfo?.os?.osVersion || "Unknown"),
        osName: deviceInfo?.os?.osName || "Unknown",
        isChrome: deviceInfo?.browser?.isChrome || false,
        isFirefox: deviceInfo?.browser?.isFirefox || false,
        isSafari: deviceInfo?.browser?.isSafari || false,
        browserName: deviceInfo?.browser?.browserName || "Unknown",
        fullBrowserVersion:
          deviceInfo?.browser?.fullBrowserVersion || "Unknown",
        browserVersion: deviceInfo?.browser?.browserVersion || "Unknown",
        userAgent: deviceInfo?.other?.userAgent || "Unknown",
        ipAddress: ip,
      },
      create: {
        guestId: activeGuestId,
        countryName: geo.countryName,
        countryCode: geo.countryCode,
        region: geo.region,
        city: geo.city,
        timezone: geo.timezone,
        isp: geo.isp,
        asn: geo.asn,
        asName: geo.asName,
        asDomain: geo.asDomain,
        continentCode: geo.continentCode,
        continentName: geo.continentName,
        latitude: geo.latitude,
        longitude: geo.longitude,
        postal: geo.postal,
        state: geo.state,
        isMobile: deviceInfo?.device?.isMobile || false,
        isMobileOnly: deviceInfo?.device?.isMobileOnly || false,
        isTablet: deviceInfo?.device?.isTablet || false,
        isDesktop: deviceInfo?.device?.isDesktop || false,
        deviceType: deviceInfo?.device?.deviceType || "Unknown",
        mobileVendor: deviceInfo?.device?.mobileVendor || "Unknown",
        mobileModel: deviceInfo?.device?.mobileModel || "Unknown",
        isAndroid: deviceInfo?.os?.isAndroid || false,
        isIOS: deviceInfo?.os?.isIOS || false,
        isWindows: deviceInfo?.os?.isWindows || false,
        isMacOs: deviceInfo?.os?.isMacOs || false,
        osVersion: String(deviceInfo?.os?.osVersion || "Unknown"),
        osName: deviceInfo?.os?.osName || "Unknown",
        isChrome: deviceInfo?.browser?.isChrome || false,
        isFirefox: deviceInfo?.browser?.isFirefox || false,
        isSafari: deviceInfo?.browser?.isSafari || false,
        browserName: deviceInfo?.browser?.browserName || "Unknown",
        fullBrowserVersion:
          deviceInfo?.browser?.fullBrowserVersion || "Unknown",
        browserVersion: deviceInfo?.browser?.browserVersion || "Unknown",
        userAgent: deviceInfo?.other?.userAgent || "Unknown",
        ipAddress: ip,
      },
    });

    // --- 6. STAGE 2: Daily Visit Analytics ---
    const browserName = deviceInfo?.browser?.browserName || "Unknown";
    const osName = deviceInfo?.os?.osName || "Unknown";
    const currentDeviceSnapshot = {
      ipAddress: ip,
      location: geo,
      browserName: browserName,
      osName: osName,
      deviceType: deviceInfo?.device?.deviceType || "Unknown",
      userAgent: deviceInfo?.other?.userAgent || "Unknown",
      visitedAt: now.toISOString(),
    };

    await prisma.user_stats.upsert({
      where: {
        entityId_visitDate: {
          entityId: primaryId,
          visitDate: todayStr,
        },
      },
      update: {
        todayVisitCount: { increment: 1 },
        lastCheckInTime: now,
      },
      create: {
        entityId: primaryId,
        visitDate: todayStr,
        entityType: entityType,
        todayVisitCount: 1,
        lastCheckInTime: now,
      },
    });


    // --- 8. STAGE 4: Guest Visited Dates & Point Accumulation ---
    let stats = await prisma.user_stats.findFirst({
      where: {
        OR: [{ entityId: primaryId }],
      },
    });

    if (!stats) {
      stats = await prisma.user_stats.create({
        data: {
          entityId: primaryId,
          entityType: entityType,
          visitDate: todayStr,
          visitedDates: [todayStr],
          lastCheckInTime: now,
        },
      });
    } else {
      if (userId && stats.entityType === "GUEST") {
        let userStats = await prisma.user_stats.findUnique({
          where: { entityId: userId },
        });
        if (!userStats) {
          userStats = await prisma.user_stats.create({
            data: {
              entityId: userId,
              entityType: "USER",
              visitDate: stats.visitDate,
              visitedDates: stats.visitedDates,
              todayVisitCount: stats.todayVisitCount,
              lastCheckInTime: now,
            },
          });
        }
        stats = userStats;
      }

      let visitedDates = [...stats.visitedDates];

      if (!visitedDates.includes(todayStr)) {
        
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              lastCheckIn: now,
            },
          });
        }
      }
    }

    return {
      guestId: activeGuestId,
      totalVisitsInCycle: stats.visitedDates.length,
      userType: entityType,
      resetWarning: !isUser && stats.visitedDates.length >= 6,
      isUserLoggedIn: isUser,
    };
  }

  static async getUserDailyStatusService({
    guestId,
    userId,
  }: GetUserDailyStatusInput) {
    try {
      let stats = null;
      let isUserRegistered = false;
      let isLoginUsingCoupon = false;
      let isLoginUsingReferral = false;
      let registeredUserId = null;
      let guestUserName = null;
      let userObj = null;

      // --- 1. Identity Mapping ---
      if (userId) {
        isUserRegistered = true;
        registeredUserId = userId;
        userObj = await prisma.user.findUnique({
          where: { id: userId },
          include: { referral: true },
        });
        if (userObj) {
          isLoginUsingReferral = !!userObj.referral?.referredBy;
        }
        stats = await prisma.user_stats.findFirst({
          where: {
            OR: [{ entityId: userId }],
          },
        });
      } else if (guestId) {
        const linkedUser = await prisma.user.findFirst({
          where: { linkedGuestId: guestId },
          include: { referral: true},
        });
        if (linkedUser) {
          isUserRegistered = true;
          registeredUserId = linkedUser.id;
          guestUserName = linkedUser.name || "";
          isLoginUsingReferral = !!linkedUser.referral?.referredBy;
          stats = await prisma.user_stats.findFirst({
            where: {
              OR: [
                { entityId: linkedUser.id },
              ],
            },
          });
        } else {
          stats = await prisma.user_stats.findFirst({
            where: {
              OR: [{ entityId: guestId }],
            },
          });
        }
      }

      const todayStr = new Date().toISOString().split("T")[0]!;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0]!;
      let allVisitedDates = stats?.visitedDates || [];

      // --- 2. Default Consistent Structure ---
      let response = {
        guestUserName: guestUserName || "",
        isAuthenticated: !!userId,
        isRegistered: isUserRegistered,
        visitedDates: [] as string[],
        isLoginUsingReferral: isLoginUsingReferral,
      };

      // --- 3. Process Dates ---
      if (guestId) {
        const guestLogsRaw = await prisma.user_stats.findMany({
          where: {
            entityId: guestId,
          },
          select: { visitDate: true },
        });
        const guestLogs = [
          ...new Set(guestLogsRaw.map((log) => log.visitDate)),
        ];

        allVisitedDates = [...new Set([...allVisitedDates, ...guestLogs])].sort();
      }

      response.visitedDates = allVisitedDates;

      return response;
    } catch (error) {
      console.error("❌ getUserDailyStatusService Error:", error);
      throw error;
    }
  }
}
