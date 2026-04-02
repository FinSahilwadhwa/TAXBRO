const fs = require("fs");
const https = require("https");
const path = require("path");
const { parse } = require("url");

const ROOT_URL = "https://www.getatoz.co/nic";
const OUTPUT_PATH = path.join(__dirname, "mca-activity-data.js");
const EXTRA_DIVISION_URLS = [
  "https://www.getatoz.co/nic/division/45/wholesale-and-retail-trade-and-repair-of-motor-vehicles-and-motorcycles",
  "https://www.getatoz.co/nic/division/46/wholesale-trade-except-of-motor-vehicles-and-motorcycles",
  "https://www.getatoz.co/nic/division/47/retail-trade-except-of-motor-vehicles-and-motorcycles",
  "https://www.getatoz.co/nic/division/49/land-transport-and-transport-via-pipelines",
  "https://www.getatoz.co/nic/division/50/water-transport",
  "https://www.getatoz.co/nic/division/51/air-transport",
  "https://www.getatoz.co/nic/division/52/warehousing-and-support-activities-for-transportation",
  "https://www.getatoz.co/nic/division/53/postal-and-courier-activities",
];

const SECTION_MAP = [
  { code: "A", title: "Agriculture, forestry and fishing", from: 1, to: 3 },
  { code: "B", title: "Mining and quarrying", from: 5, to: 9 },
  { code: "C", title: "Manufacturing", from: 10, to: 33 },
  { code: "D", title: "Electricity, gas, steam and air conditioning supply", from: 35, to: 35 },
  { code: "E", title: "Water supply; sewerage, waste management and remediation activities", from: 36, to: 39 },
  { code: "F", title: "Construction", from: 41, to: 43 },
  { code: "G", title: "Wholesale and retail trade; repair of motor vehicles and motorcycles", from: 45, to: 47 },
  { code: "H", title: "Transportation and storage", from: 49, to: 53 },
  { code: "I", title: "Accommodation and food service activities", from: 55, to: 56 },
  { code: "J", title: "Information and communication", from: 58, to: 63 },
  { code: "K", title: "Financial and insurance activities", from: 64, to: 66 },
  { code: "L", title: "Real estate activities", from: 68, to: 68 },
  { code: "M", title: "Professional, scientific and technical activities", from: 69, to: 75 },
  { code: "N", title: "Administrative and support service activities", from: 77, to: 82 },
  { code: "O", title: "Public administration and defence; compulsory social security", from: 84, to: 84 },
  { code: "P", title: "Education", from: 85, to: 85 },
  { code: "Q", title: "Human health and social work activities", from: 86, to: 88 },
  { code: "R", title: "Arts, entertainment and recreation", from: 90, to: 93 },
  { code: "S", title: "Other service activities", from: 94, to: 96 },
  { code: "T", title: "Activities of households as employers; undifferentiated goods- and services-producing activities of households for own use", from: 97, to: 98 },
  { code: "U", title: "Activities of extraterritorial organisations and bodies", from: 99, to: 99 },
];

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const options = parse(url);
    options.rejectUnauthorized = false;
    options.headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    };

    https
      .get(options, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Request failed with ${res.statusCode} for ${url}`));
          return;
        }

        let html = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          html += chunk;
        });
        res.on("end", () => resolve(html));
      })
      .on("error", reject);
  });
}

function unique(list) {
  return Array.from(new Set(list));
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&ndash;/gi, "-")
    .replace(/&mdash;/gi, "-")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function cleanText(value) {
  return decodeHtml(String(value || ""))
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeForJs(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
}

function getSectionForDivision(divisionCode) {
  const divisionNumber = Number(divisionCode);
  return (
    SECTION_MAP.find((section) => divisionNumber >= section.from && divisionNumber <= section.to) || {
      code: "",
      title: "",
    }
  );
}

function extractDivisionLinks(indexHtml) {
  return unique((indexHtml.match(/https:\/\/www\.getatoz\.co\/nic\/division\/[0-9]+\/[a-z0-9-]+/gi) || []).concat(EXTRA_DIVISION_URLS));
}

function extractGroupLinks(divisionHtml) {
  return unique(divisionHtml.match(/https:\/\/www\.getatoz\.co\/nic\/group\/[0-9]+\/[a-z0-9-]+/gi) || []);
}

function parseDivisionTitle(divisionHtml, fallbackUrl) {
  const match = divisionHtml.match(/<h1[^>]*>\s*NIC Code For Division\s+([0-9]{2})\s*-\s*([\s\S]*?)<\/h1>/i);
  if (match) {
    return {
      code: match[1],
      title: cleanText(match[2]),
    };
  }

  const urlMatch = fallbackUrl.match(/\/division\/([0-9]{2})\//i);
  return {
    code: urlMatch ? urlMatch[1] : "",
    title: "",
  };
}

function parseGroupTitle(groupHtml, fallbackUrl) {
  const match = groupHtml.match(/<h1[^>]*>\s*NIC Code For Group\s+([0-9]{3})\s*-\s*([\s\S]*?)<\/h1>/i);
  if (match) {
    return {
      code: match[1],
      title: cleanText(match[2]),
    };
  }

  const urlMatch = fallbackUrl.match(/\/group\/([0-9]{3})\//i);
  return {
    code: urlMatch ? urlMatch[1] : "",
    title: "",
  };
}

function parseGroupClasses(groupHtml) {
  const classes = [];
  const sectionPattern = /<h2[^>]*>\s*<a[^>]*href="https:\/\/www\.getatoz\.co\/nic\/class\/([0-9]{4})\/[^"]+"[^>]*>\s*Class\s+\1\s*-\s*([\s\S]*?)<\/a>\s*<\/h2>([\s\S]*?)(?=<h2[^>]*>\s*<a[^>]*href="https:\/\/www\.getatoz\.co\/nic\/class\/|<footer class=|<\/main>)/gi;
  let classMatch;

  while ((classMatch = sectionPattern.exec(groupHtml))) {
    const classCode = classMatch[1];
    const classTitle = cleanText(classMatch[2]);
    const classBlock = classMatch[3];
    const rows = [];
    const rowPattern = /<tr>\s*<td>\s*<a[^>]*href="https:\/\/www\.getatoz\.co\/nic\/code\/([0-9]{5})\/[^"]+"[^>]*>\s*\1\s*<\/a>\s*<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/gi;
    let rowMatch;

    while ((rowMatch = rowPattern.exec(classBlock))) {
      rows.push({
        code: rowMatch[1],
        title: cleanText(rowMatch[2]),
      });
    }

    classes.push({
      code: classCode,
      title: classTitle,
      activities: rows,
    });
  }

  return classes;
}

function buildJs(records, meta) {
  const lines = [
    "window.TAXBRO_MCA_DATA = [",
  ];

  for (const item of records) {
    lines.push(
      "  {" +
        `code:'${escapeForJs(item.code)}',` +
        `level:'${escapeForJs(item.level)}',` +
        `title:'${escapeForJs(item.title)}',` +
        `sectionCode:'${escapeForJs(item.sectionCode)}',` +
        `sectionTitle:'${escapeForJs(item.sectionTitle)}',` +
        `divisionCode:'${escapeForJs(item.divisionCode)}',` +
        `divisionTitle:'${escapeForJs(item.divisionTitle)}',` +
        `groupCode:'${escapeForJs(item.groupCode)}',` +
        `groupTitle:'${escapeForJs(item.groupTitle)}',` +
        `classCode:'${escapeForJs(item.classCode)}',` +
        `classTitle:'${escapeForJs(item.classTitle)}'` +
        "},"
    );
  }

  lines.push("];");
  lines.push(
    "window.TAXBRO_MCA_META = {" +
      `totalCount:${meta.totalCount},` +
      `activityCount:${meta.activityCount},` +
      `classCount:${meta.classCount},` +
      `groupCount:${meta.groupCount},` +
      `divisionCount:${meta.divisionCount},` +
      `source:'${escapeForJs(meta.source)}'` +
      "};"
  );

  return lines.join("\n") + "\n";
}

function mapLimit(items, limit, worker) {
  return new Promise((resolve, reject) => {
    const results = new Array(items.length);
    let nextIndex = 0;
    let active = 0;
    let finished = 0;

    function launchNext() {
      if (finished >= items.length) {
        resolve(results);
        return;
      }

      while (active < limit && nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        active += 1;

        Promise.resolve(worker(items[currentIndex], currentIndex))
          .then((result) => {
            results[currentIndex] = result;
            active -= 1;
            finished += 1;
            launchNext();
          })
          .catch(reject);
      }
    }

    if (!items.length) {
      resolve(results);
      return;
    }

    launchNext();
  });
}

function main() {
  const records = [];
  const seen = new Set();

  return fetchText(ROOT_URL)
    .then((indexHtml) => {
      const divisionLinks = extractDivisionLinks(indexHtml);
      console.log(`Found ${divisionLinks.length} divisions`);
      return mapLimit(divisionLinks, 8, (divisionLink) => {
        return fetchText(divisionLink).then((divisionHtml) => {
          const division = parseDivisionTitle(divisionHtml, divisionLink);
          const section = getSectionForDivision(division.code);
          const groupLinks = extractGroupLinks(divisionHtml);
          return {
            division,
            section,
            groupLinks,
          };
        });
      });
    })
    .then((divisionEntries) => {
      const groupTasks = [];

      divisionEntries.forEach((entry) => {
        const { division, section, groupLinks } = entry;
        console.log(`Division ${division.code}: ${groupLinks.length} groups`);

        const divisionRecord = {
          code: division.code,
          level: "DIVISION",
          title: division.title,
          sectionCode: section.code,
          sectionTitle: section.title,
          divisionCode: division.code,
          divisionTitle: division.title,
          groupCode: "",
          groupTitle: "",
          classCode: "",
          classTitle: "",
        };

        if (!seen.has(`DIVISION:${division.code}`)) {
          seen.add(`DIVISION:${division.code}`);
          records.push(divisionRecord);
        }

        groupLinks.forEach((groupLink) => {
          groupTasks.push({
            division,
            section,
            groupLink,
          });
        });
      });

      console.log(`Fetching ${groupTasks.length} group pages`);

      return mapLimit(groupTasks, 16, (task) => {
        return fetchText(task.groupLink).then((groupHtml) => {
          return {
            division: task.division,
            section: task.section,
            group: parseGroupTitle(groupHtml, task.groupLink),
            classes: parseGroupClasses(groupHtml),
          };
        });
      });
    })
    .then((groupEntries) => {
      groupEntries.forEach((entry) => {
        const { division, section, group, classes } = entry;

        const groupRecord = {
          code: group.code,
          level: "GROUP",
          title: group.title,
          sectionCode: section.code,
          sectionTitle: section.title,
          divisionCode: division.code,
          divisionTitle: division.title,
          groupCode: group.code,
          groupTitle: group.title,
          classCode: "",
          classTitle: "",
        };

        if (!seen.has(`GROUP:${group.code}`)) {
          seen.add(`GROUP:${group.code}`);
          records.push(groupRecord);
        }

        classes.forEach((cls) => {
          const classRecord = {
            code: cls.code,
            level: "CLASS",
            title: cls.title,
            sectionCode: section.code,
            sectionTitle: section.title,
            divisionCode: division.code,
            divisionTitle: division.title,
            groupCode: group.code,
            groupTitle: group.title,
            classCode: cls.code,
            classTitle: cls.title,
          };

          if (!seen.has(`CLASS:${cls.code}`)) {
            seen.add(`CLASS:${cls.code}`);
            records.push(classRecord);
          }

          cls.activities.forEach((activity) => {
            const activityRecord = {
              code: activity.code,
              level: "ACTIVITY",
              title: activity.title,
              sectionCode: section.code,
              sectionTitle: section.title,
              divisionCode: division.code,
              divisionTitle: division.title,
              groupCode: group.code,
              groupTitle: group.title,
              classCode: cls.code,
              classTitle: cls.title,
            };

            if (!seen.has(`ACTIVITY:${activity.code}`)) {
              seen.add(`ACTIVITY:${activity.code}`);
              records.push(activityRecord);
            }
          });
        });
      });
    })
    .then(() => {
      records.sort((a, b) => {
        if (a.code.length !== b.code.length) return a.code.length - b.code.length;
        return a.code.localeCompare(b.code);
      });

      const meta = {
        totalCount: records.length,
        activityCount: records.filter((item) => item.level === "ACTIVITY").length,
        classCount: records.filter((item) => item.level === "CLASS").length,
        groupCount: records.filter((item) => item.level === "GROUP").length,
        divisionCount: records.filter((item) => item.level === "DIVISION").length,
        source: "NIC hierarchy generated from structured public listings",
      };

      fs.writeFileSync(OUTPUT_PATH, buildJs(records, meta), "utf8");

      console.log(`Wrote ${meta.totalCount} records to ${OUTPUT_PATH}`);
      console.log(
        `Activities: ${meta.activityCount}, Classes: ${meta.classCount}, Groups: ${meta.groupCount}, Divisions: ${meta.divisionCount}`
      );
    });
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
