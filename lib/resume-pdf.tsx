import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import type { Profile } from "@/lib/profile";
import type { GeneratedResumeContent } from "@/lib/resume";

// Hex values mirror ui-tokens.md's --color-text-primary/--color-text-secondary/--color-border/--color-accent —
// @react-pdf/renderer's StyleSheet has no CSS variable support, so plain values are the closest match available.
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica" },
  name: { fontSize: 20, fontWeight: "bold", color: "#101828" },
  contactRow: { marginTop: 4, fontSize: 10, color: "#6A7282" },
  section: { marginTop: 16 },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#101828",
    borderBottom: "1px solid #E7EAF3",
    paddingBottom: 4,
    marginBottom: 8,
  },
  bodyText: { fontSize: 10, color: "#364153", lineHeight: 1.4 },
  skillsRow: { fontSize: 10, color: "#364153" },
  roleHeading: { fontSize: 11, fontWeight: "bold", color: "#101828" },
  roleSubheading: { fontSize: 10, color: "#6A7282", marginTop: 1 },
  role: { marginBottom: 10 },
  bullet: { fontSize: 10, color: "#364153", marginTop: 3, lineHeight: 1.4 },
});

function contactLine(profile: Profile, email: string): string {
  return [email, profile.phone, profile.location, profile.linkedinUrl, profile.portfolioUrl]
    .filter((value) => value && value.trim().length > 0)
    .join("  •  ");
}

function educationLine(profile: Profile): string {
  const { highestDegree, fieldOfStudy, institutionName, graduationYear } = profile.education;
  const parts = [
    [highestDegree, fieldOfStudy].filter(Boolean).join(" in "),
    institutionName,
    graduationYear,
  ].filter((part) => part && part.trim().length > 0);
  return parts.join(", ");
}

type ResumePDFProps = {
  profile: Profile;
  email: string;
  content: GeneratedResumeContent;
};

export function ResumePDF({ profile, email, content }: ResumePDFProps) {
  const contact = contactLine(profile, email);
  const education = educationLine(profile);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{profile.fullName || "Resume"}</Text>
        {profile.currentTitle && <Text style={styles.contactRow}>{profile.currentTitle}</Text>}
        {contact && <Text style={styles.contactRow}>{contact}</Text>}

        {content.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Summary</Text>
            <Text style={styles.bodyText}>{content.summary}</Text>
          </View>
        )}

        {profile.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Skills</Text>
            <Text style={styles.skillsRow}>{profile.skills.join("  •  ")}</Text>
          </View>
        )}

        {content.workExperience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Work Experience</Text>
            {content.workExperience.map((role, index) => (
              <View key={index} style={styles.role}>
                <Text style={styles.roleHeading}>{role.jobTitle}</Text>
                <Text style={styles.roleSubheading}>
                  {[role.company, role.dateRange].filter(Boolean).join("  •  ")}
                </Text>
                {role.bullets.map((bullet, bulletIndex) => (
                  <Text key={bulletIndex} style={styles.bullet}>
                    •  {bullet}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {education && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Education</Text>
            <Text style={styles.bodyText}>{education}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
