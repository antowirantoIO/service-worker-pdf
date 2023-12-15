import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { createElement } from 'react';
import cors from 'cors';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

export type InterfaceProduct = {
  id: number;
  product_code: string;
  contain: string;
  gross_weight: string;
  to_print: string;
}

export type InterfaceShippingMark = {
  po_ref: string;
  company_name: string;
  tax_id_company: string;
  origin: string;
}

export type InterfaceShippingMarkProps = {
  products: InterfaceProduct[];
  logo: string[];
  company_logo: string;
  shipping_mark: InterfaceShippingMark;
  attentions: string[];
}

export type InterfaceShippingMarkContentProps = {
  product: InterfaceProduct;
  companyLogo: string;
  shippingMark: InterfaceShippingMark;
  attentions: string[];
  logo: string[];
  index: number;
}

export type PDFProps = {
  products: InterfaceProduct[];
  logo: string[];
  companyLogo: string;
  shippingMark: InterfaceShippingMark;
  attentions: string[];
};

app.use(express.json()); // Middleware for parsing JSON in the request body

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
}

app.use(cors(corsOptions));

const renderPDFFunction = async (props: PDFProps) => {
  const { pdf } = await import('@react-pdf/renderer');
  const { PDF } = await import('./PDF');

  // @ts-ignore
  return pdf(createElement(PDF, props)).toBuffer();
};

app.get('/', (req, res) => {
  res.send('Hello World!');
})

app.post('/generate', async (req, res) => {
  try {
    const props: PDFProps = req.body;

    // @ts-ignore
    const stream = await renderPDFFunction(props);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=shipping-mark.pdf');
    stream.pipe(res);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});