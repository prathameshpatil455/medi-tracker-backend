import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { generateTransactionPDF } from "../utils/generateSummaryPDF.js";

// Resolve __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const downloadTransactionReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const days = req.query.days || 7;

    // Generate relative path from generator
    const relativePath = await generateTransactionPDF(userId, days); // e.g., "reports/report-abc.pdf"

    console.log("Report file:", relativePath);
    console.log("Report directory:", path.join(__dirname, ".."));

    // Resolve full path
    const absolutePath = path.resolve(__dirname, "..", relativePath);

    console.log("Absolute path:", absolutePath);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: "Report file not found" });
    }

    // Trigger download
    res.download(absolutePath, (err) => {
      if (err) {
        console.error("Download error:", err);
        res.status(500).json({ message: "Could not download file" });
      }
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ message: "Failed to generate report" });
  }
};
