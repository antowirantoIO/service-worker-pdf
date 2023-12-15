import {Document, Page, Text, Font, StyleSheet, View, Image, Svg, Path} from '@react-pdf/renderer';
import React, {FC, useEffect, useMemo} from 'react';
import {InterfaceProduct, InterfaceShippingMark, InterfaceShippingMarkContentProps} from "./index";
import {QRCodeSVG} from "./utils/qrgenerator";

function base64Encode(str: string): string {
    return Buffer.from(str).toString('base64')
}

const baseUrl: string = 'http://isma.devinnovation.tech';

Font.register({
    family: 'Inter',
    src: 'https://rsms.me/inter/font-files/Inter-Regular.woff2',
});

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        margin: 10,
        paddingRight: 40,
        paddingLeft: 40,
        paddingTop: 60,
        paddingBottom: 60,
        fontSize: '16px',
    },
    containerBox: {
        margin: 0,
        flexGrow: 1,
    },
    boxMark: {
        margin: 0,
        padding: 0,
        flexGrow: 1,
    },
    row: {
        flexDirection: 'row',
        paddingTop: '15px',
        alignItems: 'center',
    },
    column10: {
        flex: 1,
        paddingRight: 10,
    },
    column2: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    label: {
        width: '80%',
    },
    value: {
        width: '80%',
        // @ts-ignore
        whiteSpace: 'nowrap',
    },
    label_company: {
        width: '26%',
    },
    value_company: {
        width: '70%',
        // @ts-ignore
        whiteSpace: 'normal',
    },
    imageContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    image: {
        maxWidth: '100%',
        maxHeight: '120px',
        objectFit: 'contain',
    },
    pt5: {
        paddingTop: '15px'
    },
    rowPt3: {
        flexDirection: 'row',
        paddingTop: '30px',
    },
    column7: {
        flex: 0.7,
    },
    column5: {
        flex: 0.5,
    },
    qrCodeContainer: {
        justifyContent: 'flex-end',
        paddingRight: 5,
        position: 'absolute',
        right: 0,
        top: -10
    },
    rowPt6: {
        flexDirection: 'row',
        marginTop: 80,
    },
    column11: {
        flex: 1.1,
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    item: {
        flex: '1',
        flexDirection: 'row',
        // justifyContent: 'flex-start',
    },
    logoImage: {
        width: 85,
        height: 85,
        paddingRight: '9px'
    },
    column1: {
        flex: 0.1,
    },
    rotate: {
        transform: 'rotate(90deg)',
    },
    imageqr : {
        width: '150px',
        height: '150px',
    },
    bold: {
        fontWeight: 'bold',
        fontSize: '18px',
    },
});

export type PDFProps = {
    products: InterfaceProduct[];
    logo: string[];
    companyLogo: string;
    shippingMark: InterfaceShippingMark;
    attentions: string[];
};

export const PDF: FC<PDFProps> = ({ products, logo, companyLogo, shippingMark, attentions }) => {
    return (
        <Document title={shippingMark.po_ref}>
            {products.map((product) => (
                <React.Fragment key={product.product_code}>
                    <Page size="A4" style={{
                        display: 'flex',         // Enable flexbox
                        justifyContent: 'center', // Center horizontally within the View
                        alignItems: 'center',     // Center vertically within the View
                        margin: 10,
                        fontSize: '30px',
                        paddingTop: '100px',
                        color: '#fff',
                    }}>
                        <View style={{
                            backgroundColor: '#7f7f7f',
                            width: '100%',
                            height: '100%',
                            textAlign: 'center',
                            display: 'flex',         // Enable flexbox
                            justifyContent: 'center', // Center horizontally within the View
                            alignItems: 'center',     // Center vertically within the View
                            maxWidth: '70%',
                            maxHeight: '55%',
                        }}>
                            <Text style={{
                                textAlign: 'center',
                            }}>
                                {product.product_code}
                            </Text>
                            <View style={{
                                height: 20,
                            }} />
                            <Text style={{
                                textAlign: 'center',
                            }}>
                                {product.to_print}
                            </Text>
                        </View>
                    </Page>
                    {Array.from({ length: parseInt(product.to_print, 10) }, (_, index) => (
                        <ShippingMarkContent
                            key={index}
                            product={product}
                            companyLogo={companyLogo}
                            shippingMark={shippingMark}
                            attentions={attentions}
                            logo={logo}
                            index={index}
                        />
                    ))}
                </React.Fragment>
            ))}
        </Document>
    );
};

type ShippingMarkCompanyLogoProps = {
    companyLogo: string;
}

const ShippingMarkCompanyLogo = React.memo(({ companyLogo }: ShippingMarkCompanyLogoProps) => {
    return (
        <View style={styles.imageContainer}>
            {
                companyLogo && (
                    <Image src={`${baseUrl}${companyLogo}`} style={styles.image}/>
                )
            }
        </View>
    );
})

type ShippingMarkAttentionLogoProps = {
    logo: string[];
}

const ShippingMarkAttentionLogo = React.memo(({logo}: ShippingMarkAttentionLogoProps) => {
    return (
        <View style={styles.column11}>
            <Image src={`${baseUrl}/admin/assets/images/attached-files/logo-1.png`} style={{
                width: 85,
                height: 85,
            }}/>
            <View style={{
                width: 30,
                height: 85,
            }} />
            {logo &&
                Array.from({length: logo.length}, (_, idx) => (
                    <>
                        <Image
                            key={idx}
                            src={`${baseUrl}/admin/assets/images/attached-files/logo-${logo[idx]}.png`}
                            style={{
                                width: 85,
                                height: 85,
                            }}
                        />
                        <View style={{
                            width: 30,
                            height: 85,
                        }} />
                    </>
                ))}
        </View>
    )
})

const ShippingMarkContent = React.memo((
    { product, companyLogo, shippingMark, attentions, logo, index}: InterfaceShippingMarkContentProps) => {

    const qrCodeData = useMemo(() => {
        return `${baseUrl}/shipping-mark/verify/${base64Encode(product.id + '#' + (index + 1) + '/' + product.to_print)}`;
    }, [index]);

    return (
        <>
            <Page size="A4" style={styles.page} key={index}>
                <View style={styles.containerBox}>
                    <View style={styles.boxMark}>
                        <View style={styles.row}>
                            <View style={styles.column10}>
                                <View style={styles.row}>
                                    <Text style={styles.label}>REFERENCE</Text>
                                    <Text>: </Text>
                                    <Text style={styles.value}>{product.product_code}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>CONTAIN</Text>
                                    <Text>: </Text>
                                    <Text style={styles.value}>{product.contain} PCS</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>GROSS WEIGHT</Text>
                                    <Text>: </Text>
                                    <Text style={styles.value}>{parseFloat(product.gross_weight).toFixed(2)} KGS</Text>
                                </View>
                            </View>
                            <View style={styles.column2}>
                                <ShippingMarkCompanyLogo companyLogo={companyLogo} />
                            </View>
                        </View>
                        <View style={styles.pt5}>
                            <View style={styles.row}>
                                <Text style={styles.label_company}>IMPORTER</Text>
                                <Text style={styles.value_company}>{shippingMark.company_name}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label_company}>CNPJ</Text>
                                <Text style={styles.value_company}>{shippingMark.tax_id_company}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label_company}>ORIGIN</Text>
                                <Text style={styles.value_company}>{shippingMark.origin}</Text>
                            </View>
                        </View>
                        <View style={styles.rowPt3}>
                            <View style={styles.column7}>
                                {attentions.length > 0 && (
                                    <>
                                        <Text>
                                            <Text style={styles.bold}>SPECIAL INSTRUCTIONS</Text>
                                        </Text>
                                        <View>
                                            {attentions.map((attention, idx) => (
                                                <View style={{
                                                    paddingTop: '11px',
                                                }}>
                                                    <Text key={idx}>
                                                        • {attention}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    </>
                                )}
                            </View>
                            <View style={styles.column5}>
                                <View style={styles.qrCodeContainer}>
                                    {/*{index % 2 == 0 ? (*/}
                                    {/*    <Image src={qrCodeUrl} style={styles.imageqr}/>*/}
                                    <QRCodeSVG value={qrCodeData} size={120} />
                                </View>
                            </View>
                            <View style={styles.column1}>
                                <Text style={styles.rotate}>{shippingMark.po_ref}</Text>
                            </View>
                        </View>
                        <View style={{
                            flexDirection: 'row',
                            marginTop: attentions.length > 1 ? 50 : 90,
                        }}>
                            <ShippingMarkAttentionLogo logo={logo} />
                        </View>
                    </View>
                </View>
            </Page>
        </>
    );
});