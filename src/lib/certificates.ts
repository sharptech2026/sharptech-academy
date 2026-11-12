import type { CourseId } from "@/lib/curriculum";

export interface Certificate {
  id: string;
  courseId: CourseId;
  name: string;
  issuedAt: string;
  xpAtIssue: number;
  lessonsCompleted: number;
  perfectLessons: number;
  streakAtIssue: number;
  certificateNumber: string;
}

const COURSE_NAMES: Record<CourseId, string> = {
  js: "JavaScript",
  py: "Python",
  cs: "C#",
  web: "HTML e CSS",
  sql: "SQL",
};

const COURSE_ICONS: Record<CourseId, string> = {
  js: "⚡",
  py: "🐍",
  cs: "🔷",
  web: "🌐",
  sql: "🗄️",
};

export function generateCertificate(
  courseId: CourseId,
  studentName: string,
  stats: {
    xp: number;
    completed: Record<string, { correct: number; total: number; perfect: boolean }>;
    streak: number;
  },
): Certificate {
  const courseLessons = Object.keys(stats.completed).filter((k) => k.startsWith(`${courseId}-`));
  const perfectCount = courseLessons.filter((k) => stats.completed[k].perfect).length;

  const certificateNumber = `STA-${courseId.toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  return {
    id: `cert-${courseId}-${Date.now()}`,
    courseId,
    name: studentName,
    issuedAt: new Date().toISOString(),
    xpAtIssue: stats.xp,
    lessonsCompleted: courseLessons.length,
    perfectLessons: perfectCount,
    streakAtIssue: stats.streak,
    certificateNumber,
  };
}

export function getCertificateHTML(certificate: Certificate): string {
  const courseName = COURSE_NAMES[certificate.courseId];
  const icon = COURSE_ICONS[certificate.courseId];
  const date = new Date(certificate.issuedAt).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `
<!doctype html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <title>Certificado SharpTech Academy - ${courseName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,560;9..144,700&family=Outfit:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4 landscape; margin: 0; }
    body {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f3f6fb 0%, #e7efff 100%);
      font-family: 'Outfit', sans-serif;
    }
    .certificate {
      width: 842px;
      height: 595px;
      position: relative;
      background: white;
      border: 8px solid #1860f8;
      border-radius: 4px;
      box-shadow: 0 20px 60px rgba(16, 32, 51, 0.15);
      overflow: hidden;
    }
    .certificate::before {
      content: '';
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      bottom: 20px;
      border: 2px solid #1860f8;
      border-radius: 2px;
      pointer-events: none;
    }
    .bg-pattern {
      position: absolute;
      inset: 0;
      background-image:
        radial-gradient(circle at 20% 20%, rgba(24, 96, 248, 0.03) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(196, 132, 10, 0.03) 0%, transparent 50%);
      pointer-events: none;
    }
    .corner {
      position: absolute;
      width: 60px;
      height: 60px;
      border: 3px solid #1860f8;
    }
    .corner.tl { top: 30px; left: 30px; border-right: none; border-bottom: none; border-radius: 4px 0 0 0; }
    .corner.tr { top: 30px; right: 30px; border-left: none; border-bottom: none; border-radius: 0 4px 0 0; }
    .corner.bl { bottom: 30px; left: 30px; border-right: none; border-top: none; border-radius: 0 0 0 4px; }
    .corner.br { bottom: 30px; right: 30px; border-left: none; border-top: none; border-radius: 0 0 4px 0; }
    .content {
      position: relative;
      z-index: 1;
      padding: 60px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .header {
      text-align: center;
      padding-bottom: 30px;
      border-bottom: 1px solid #d7e1ee;
    }
    .logo { font-size: 48px; margin-bottom: 8px; }
    .title {
      font-family: 'Fraunces', serif;
      font-size: 32px;
      color: #102033;
      margin-bottom: 4px;
    }
    .subtitle { color: #5c6b80; font-size: 16px; font-weight: 500; }
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 40px 0;
    }
    .awarded { color: #5c6b80; font-size: 18px; margin-bottom: 12px; }
    .student-name {
      font-family: 'Fraunces', serif;
      font-size: 42px;
      color: #102033;
      margin-bottom: 8px;
      text-transform: capitalize;
    }
    .course-badge {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      background: linear-gradient(135deg, #1860f8, #0d3ec4);
      color: white;
      padding: 16px 32px;
      border-radius: 50px;
      font-size: 20px;
      font-weight: 600;
      margin-top: 24px;
      box-shadow: 0 8px 24px rgba(24, 96, 248, 0.3);
    }
    .course-icon { font-size: 28px; }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 30px;
      border-top: 1px solid #d7e1ee;
      font-size: 14px;
      color: #5c6b80;
    }
    .detail {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .detail-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #9aabc2; }
    .detail-value { font-weight: 600; color: #102033; font-family: 'Fraunces', serif; }
    .seal {
      width: 100px;
      height: 100px;
      border: 3px solid #c4840a;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #fff4d6, #ffe8b3);
    }
    .seal-text { font-family: 'Fraunces', serif; font-size: 14px; color: #c4840a; font-weight: 700; }
    .seal-sub { font-size: 10px; color: #9a8456; }
    .number { font-family: monospace; font-size: 11px; color: #9aabc2; letter-spacing: 1px; }
    @media print {
      body { background: white; }
      .certificate { box-shadow: none; border: 8px solid #1860f8; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="bg-pattern"></div>
    <div class="corner tl"></div>
    <div class="corner tr"></div>
    <div class="corner bl"></div>
    <div class="corner br"></div>
    <div class="content">
      <div class="header">
        <div class="logo">${icon}</div>
        <div class="title">SharpTech Academy</div>
        <div class="subtitle">Certificado de Conclusão</div>
      </div>
      <div class="main">
        <div class="awarded">Este certifica que</div>
        <div class="student-name">${certificate.name}</div>
        <div class="awarded">concluiu com sucesso o percurso de</div>
        <div class="course-badge">
          <span class="course-icon">${icon}</span>
          <span>${courseName}</span>
        </div>
      </div>
      <div class="footer">
        <div class="detail">
          <span class="detail-label">Lições completadas</span>
          <span class="detail-value">${certificate.lessonsCompleted}</span>
        </div>
        <div class="detail">
          <span class="detail-label">Lições perfeitas</span>
          <span class="detail-value">${certificate.perfectLessons}</span>
        </div>
        <div class="detail">
          <span class="detail-label">XP total</span>
          <span class="detail-value">${certificate.xpAtIssue.toLocaleString()}</span>
        </div>
        <div class="detail">
          <span class="detail-label">Sequência</span>
          <span class="detail-value">${certificate.streakAtIssue} dias</span>
        </div>
        <div class="seal">
          <span class="seal-text">OFICIAL</span>
          <span class="seal-sub">SHARPTECH</span>
        </div>
      </div>
      <div style="text-align: center; margin-top: 16px; font-size: 11px; color: #9aabc2;">
        <span class="number">${certificate.certificateNumber}</span>
        <span style="margin-left: 24px;">Emitido a ${date}</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function downloadCertificate(certificate: Certificate) {
  const html = getCertificateHTML(certificate);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `certificado-${certificate.courseId}-${certificate.certificateNumber}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printCertificate(certificate: Certificate) {
  const html = getCertificateHTML(certificate);
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  }
}

const STORAGE_KEY = "sharptech-certificates";

export function saveCertificate(certificate: Certificate) {
  const existing = getCertificates();
  existing.push(certificate);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function getCertificates(): Certificate[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function hasCertificate(courseId: CourseId): boolean {
  return getCertificates().some((c) => c.courseId === courseId);
}

export function getCertificate(courseId: CourseId): Certificate | null {
  return getCertificates().find((c) => c.courseId === courseId) ?? null;
}