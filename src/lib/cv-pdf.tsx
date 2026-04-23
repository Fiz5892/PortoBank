import { Document, Page, Text, View, StyleSheet, Font, pdf } from "@react-pdf/renderer";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7SUc.woff", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa1pL7SUc.woff", fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Inter", fontSize: 10, color: "#1a2238" },
  header: { borderBottomWidth: 2, borderBottomColor: "#1D6FE8", paddingBottom: 12, marginBottom: 18 },
  name: { fontSize: 22, fontWeight: 700, color: "#0F4FB8" },
  profession: { fontSize: 12, fontWeight: 600, color: "#1D6FE8", marginTop: 2 },
  meta: { fontSize: 9, color: "#5b6478", marginTop: 4 },
  bio: { fontSize: 10, marginTop: 8, lineHeight: 1.5 },
  section: { marginTop: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0F4FB8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  skillRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  skillPill: {
    backgroundColor: "#F5F7FA",
    color: "#1a2238",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 9,
    marginRight: 4,
    marginBottom: 4,
  },
  itemBlock: { marginBottom: 10 },
  itemTitle: { fontSize: 11, fontWeight: 700 },
  itemMeta: { fontSize: 9, color: "#5b6478", marginTop: 1 },
  itemDesc: { fontSize: 9.5, marginTop: 3, lineHeight: 1.4 },
  link: { fontSize: 9, color: "#1D6FE8", marginTop: 2 },
});

export interface CVData {
  fullName: string;
  profession: string | null;
  location: string | null;
  email?: string | null;
  bio: string | null;
  skills: string[];
  items: Array<{
    type: string;
    title: string;
    description: string | null;
    external_link: string | null;
    tags: string[] | null;
  }>;
}

export const CVDocument = ({ data }: { data: CVData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.name}>{data.fullName || "Your Name"}</Text>
        {data.profession && <Text style={styles.profession}>{data.profession}</Text>}
        <Text style={styles.meta}>
          {[data.location, data.email].filter(Boolean).join(" · ")}
        </Text>
        {data.bio && <Text style={styles.bio}>{data.bio}</Text>}
      </View>

      {data.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillRow}>
            {data.skills.map((s) => (
              <Text key={s} style={styles.skillPill}>
                {s}
              </Text>
            ))}
          </View>
        </View>
      )}

      {data.items.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selected Works</Text>
          {data.items.map((it, idx) => (
            <View key={idx} style={styles.itemBlock}>
              <Text style={styles.itemTitle}>{it.title}</Text>
              <Text style={styles.itemMeta}>
                {it.type}
                {it.tags && it.tags.length > 0 ? ` · ${it.tags.join(", ")}` : ""}
              </Text>
              {it.description && <Text style={styles.itemDesc}>{it.description}</Text>}
              {it.external_link && <Text style={styles.link}>{it.external_link}</Text>}
            </View>
          ))}
        </View>
      )}
    </Page>
  </Document>
);

export const generateCVBlob = async (data: CVData): Promise<Blob> => {
  return await pdf(<CVDocument data={data} />).toBlob();
};

export const downloadCV = async (data: CVData) => {
  const blob = await generateCVBlob(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const name = (data.fullName || "portobank").replace(/\s+/g, "-").toLowerCase();
  a.download = `${name}-cv.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
