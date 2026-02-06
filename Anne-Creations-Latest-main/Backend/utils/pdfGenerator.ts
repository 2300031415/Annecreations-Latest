import fs from 'fs';
import path from 'path';

import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';

interface ProductForCatalog {
  productModel: string;
  stitches?: string;
  dimensions?: string;
  colourNeedles?: string;
  image?: string;
  additionalImages?: Array<{ image: string; sortOrder: number }>;
}

interface CatalogOptions {
  categoryName: string;
  products: ProductForCatalog[];
}

/**
 * Generate a PDF for a single product
 */
export async function generateProductPDF(product: ProductForCatalog): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  await addProductPage(pdfDoc, product, titleFont, regularFont, boldFont);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Generate a PDF catalog for a category with products
 */
export async function generateCategoryPDFCatalog(options: CatalogOptions): Promise<Buffer> {
  const { categoryName, products } = options;

  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Embed fonts
  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Add title page
  await addTitlePage(pdfDoc, categoryName, titleFont);

  // Add each product to the catalog
  for (const product of products) {
    await addProductPage(pdfDoc, product, titleFont, regularFont, boldFont);
  }

  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Add a title page to the PDF
 */
async function addTitlePage(
  pdfDoc: PDFDocument,
  categoryName: string,
  titleFont: any
): Promise<void> {
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();

  // Title
  const titleText = `${categoryName} Catalog`;
  const titleSize = 32;
  const titleWidth = titleFont.widthOfTextAtSize(titleText, titleSize);

  page.drawText(titleText, {
    x: (width - titleWidth) / 2,
    y: height - 200,
    size: titleSize,
    font: titleFont,
    color: rgb(0.1, 0.1, 0.4),
  });

  // Subtitle
  const subtitleText = 'Product Collection';
  const subtitleSize = 18;
  const subtitleWidth = titleFont.widthOfTextAtSize(subtitleText, subtitleSize);

  page.drawText(subtitleText, {
    x: (width - subtitleWidth) / 2,
    y: height - 250,
    size: subtitleSize,
    font: titleFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Date
  const dateText = `Generated on ${new Date().toLocaleDateString()}`;
  const dateSize = 12;
  const dateWidth = titleFont.widthOfTextAtSize(dateText, dateSize);

  page.drawText(dateText, {
    x: (width - dateWidth) / 2,
    y: height - 300,
    size: dateSize,
    font: titleFont,
    color: rgb(0.5, 0.5, 0.5),
  });
}

/**
 * Add a product page to the PDF
 */
async function addProductPage(
  pdfDoc: PDFDocument,
  product: ProductForCatalog,
  titleFont: any,
  regularFont: any,
  boldFont: any
): Promise<void> {
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();
  const margin = 50;
  let yPosition = height - margin;

  // Product Model (Design Code) - Header
  const modelSize = 24;
  page.drawText(`Design Code: ${product.productModel}`, {
    x: margin,
    y: yPosition,
    size: modelSize,
    font: titleFont,
    color: rgb(0.1, 0.1, 0.4),
  });
  yPosition -= 40;

  // Add main product image if available
  if (product.image) {
    try {
      const imageResult = await embedImageSafely(pdfDoc, product.image);
      if (imageResult.success && imageResult.image) {
        const maxWidth = width - 2 * margin;
        const maxHeight = 300;

        const { width: imgWidth, height: imgHeight } = scaleImage(
          imageResult.dimensions!.width,
          imageResult.dimensions!.height,
          maxWidth,
          maxHeight
        );

        // Center the image
        const xPos = margin + (maxWidth - imgWidth) / 2;

        page.drawImage(imageResult.image, {
          x: xPos,
          y: yPosition - imgHeight,
          width: imgWidth,
          height: imgHeight,
        });

        yPosition -= imgHeight + 20;
      }
    } catch (error) {
      console.error(`Error embedding main image for ${product.productModel}:`, error);
    }
  }

  // Product Details Section
  yPosition -= 10;
  const detailsStartY = yPosition;

  if (product.stitches) {
    yPosition = drawTextField(
      page,
      'Stitches:',
      product.stitches,
      margin,
      yPosition,
      boldFont,
      regularFont
    );
    yPosition -= 15;
  }

  if (product.dimensions) {
    yPosition = drawTextField(
      page,
      'Dimensions:',
      product.dimensions,
      margin,
      yPosition,
      boldFont,
      regularFont
    );
    yPosition -= 15;
  }

  if (product.colourNeedles) {
    yPosition = drawTextField(
      page,
      'Colour Needles:',
      product.colourNeedles,
      margin,
      yPosition,
      boldFont,
      regularFont
    );
    yPosition -= 15;
  }

  // Add additional images if available
  if (product.additionalImages && product.additionalImages.length > 0) {
    yPosition -= 20;

    // Sort additional images by sortOrder
    const sortedImages = [...product.additionalImages].sort((a, b) => a.sortOrder - b.sortOrder);

    for (let i = 0; i < sortedImages.length; i++) {
      const additionalImage = sortedImages[i];

      // Check if we need a new page
      if (yPosition < 200) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = height - margin;

        // Add product model header on new page
        page.drawText(`Design Code: ${product.productModel} (continued)`, {
          x: margin,
          y: yPosition,
          size: 16,
          font: titleFont,
          color: rgb(0.1, 0.1, 0.4),
        });
        yPosition -= 30;
      }

      try {
        const imageResult = await embedImageSafely(pdfDoc, additionalImage.image);
        if (imageResult.success && imageResult.image) {
          const maxWidth = width - 2 * margin;
          const maxHeight = 250;

          const { width: imgWidth, height: imgHeight } = scaleImage(
            imageResult.dimensions!.width,
            imageResult.dimensions!.height,
            maxWidth,
            maxHeight
          );

          // Center the image
          const xPos = margin + (maxWidth - imgWidth) / 2;

          // Add label for additional image
          page.drawText(`Additional Image ${i + 1}`, {
            x: margin,
            y: yPosition,
            size: 10,
            font: boldFont,
            color: rgb(0.3, 0.3, 0.3),
          });
          yPosition -= 15;

          page.drawImage(imageResult.image, {
            x: xPos,
            y: yPosition - imgHeight,
            width: imgWidth,
            height: imgHeight,
          });

          yPosition -= imgHeight + 20;
        }
      } catch (error) {
        console.error(
          `Error embedding additional image ${i + 1} for ${product.productModel}:`,
          error
        );
      }
    }
  }
}

/**
 * Safely embed an image into the PDF with error handling
 */
async function embedImageSafely(
  pdfDoc: PDFDocument,
  imagePath: string
): Promise<{
  success: boolean;
  image?: any;
  dimensions?: { width: number; height: number };
}> {
  try {
    const fullPath = path.join(process.cwd(), imagePath);

    if (!fs.existsSync(fullPath)) {
      console.warn(`Image not found: ${fullPath}`);
      return { success: false };
    }

    const imageBytes = fs.readFileSync(fullPath);
    const ext = path.extname(imagePath).toLowerCase();

    let image;
    if (ext === '.png') {
      image = await pdfDoc.embedPng(imageBytes);
    } else if (ext === '.jpg' || ext === '.jpeg') {
      image = await pdfDoc.embedJpg(imageBytes);
    } else {
      console.warn(`Unsupported image format: ${ext}`);
      return { success: false };
    }

    return {
      success: true,
      image,
      dimensions: { width: image.width, height: image.height },
    };
  } catch (error) {
    console.error(`Error embedding image ${imagePath}:`, error);
    return { success: false };
  }
}

/**
 * Scale image to fit within max dimensions while maintaining aspect ratio
 */
function scaleImage(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // Scale down if larger than max dimensions
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width, height };
}

/**
 * Draw a text field with label and value
 */
function drawTextField(
  page: PDFPage,
  label: string,
  value: string,
  x: number,
  y: number,
  boldFont: any,
  regularFont: any
): number {
  const fontSize = 11;
  const labelWidth = boldFont.widthOfTextAtSize(label, fontSize);

  // Draw label
  page.drawText(label, {
    x,
    y,
    size: fontSize,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Draw value
  page.drawText(value, {
    x: x + labelWidth + 5,
    y,
    size: fontSize,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  return y;
}

/**
 * Draw a text block with label and multi-line value
 */
function drawTextBlock(
  page: PDFPage,
  label: string,
  value: string,
  x: number,
  y: number,
  boldFont: any,
  regularFont: any,
  maxWidth: number
): number {
  const fontSize = 11;
  const lineHeight = 14;

  // Draw label
  page.drawText(label, {
    x,
    y,
    size: fontSize,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  y -= lineHeight;

  // Wrap text and draw
  const words = value.split(' ');
  let line = '';
  const lines: string[] = [];

  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word;
    const testWidth = regularFont.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth - 10) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }

  if (line) lines.push(line);

  // Draw each line
  for (const textLine of lines) {
    page.drawText(textLine, {
      x: x + 10,
      y,
      size: fontSize,
      font: regularFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= lineHeight;
  }

  return y;
}
