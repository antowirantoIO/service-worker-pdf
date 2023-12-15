import React from 'react';
import type {CSSProperties} from 'react';
import {Svg, Path} from '@react-pdf/renderer';
import qrcodegen from './qrcodegen';

type Modules = ReturnType<qrcodegen.QrCode['getModules']>;
type Excavation = {x: number; y: number; w: number; h: number};

const ERROR_LEVEL_MAP: {[index: string]: qrcodegen.QrCode.Ecc} = {
    L: qrcodegen.QrCode.Ecc.LOW,
    M: qrcodegen.QrCode.Ecc.MEDIUM,
    Q: qrcodegen.QrCode.Ecc.QUARTILE,
    H: qrcodegen.QrCode.Ecc.HIGH,
};

type ImageSettings = {
    src: string;
    height: number;
    width: number;
    excavate: boolean;
    x?: number;
    y?: number;
    opacity?: number;
};

type QRProps = {
    value: string;
    size?: number;
    // Should be a real enum, but doesn't seem to be compatible with real code.
    level?: string;
    bgColor?: string;
    fgColor?: string;
    style?: CSSProperties;
    includeMargin?: boolean;
    marginSize?: number;
    imageSettings?: ImageSettings;
    title?: string;
    minVersion?: number;
};

type QRPropsSVG = QRProps & React.SVGAttributes<SVGSVGElement>;

const DEFAULT_SIZE = 128;
const DEFAULT_LEVEL = 'L';
const DEFAULT_BGCOLOR = '#FFFFFF';
const DEFAULT_FGCOLOR = '#000000';
const DEFAULT_INCLUDEMARGIN = false;
const DEFAULT_MINVERSION = 1;

const SPEC_MARGIN_SIZE = 4;
const DEFAULT_MARGIN_SIZE = 0;

// This is *very* rough estimate of max amount of QRCode allowed to be covered.
// It is "wrong" in a lot of ways (area is a terrible way to estimate, it
// really should be number of modules covered), but if for some reason we don't
// get an explicit height or width, I'd rather default to something than throw.
const DEFAULT_IMG_SCALE = 0.1;

function generatePath(modules: Modules, margin: number = 0): string {
    const ops: Array<string> = [];
    modules.forEach(function (row, y) {
        let start: number | null = null;
        row.forEach(function (cell, x) {
            if (!cell && start !== null) {
                // M0 0h7v1H0z injects the space with the move and drops the comma,
                // saving a char per operation
                ops.push(
                    `M${start + margin} ${y + margin}h${x - start}v1H${start + margin}z`
                );
                start = null;
                return;
            }

            // end of row, clean up or skip
            if (x === row.length - 1) {
                if (!cell) {
                    // We would have closed the op above already so this can only mean
                    // 2+ light modules in a row.
                    return;
                }
                if (start === null) {
                    // Just a single dark module.
                    ops.push(`M${x + margin},${y + margin} h1v1H${x + margin}z`);
                } else {
                    // Otherwise finish the current line.
                    ops.push(
                        `M${start + margin},${y + margin} h${x + 1 - start}v1H${
                            start + margin
                        }z`
                    );
                }
                return;
            }

            if (cell && start === null) {
                start = x;
            }
        });
    });
    return ops.join('');
}

// We could just do this in generatePath, except that we want to support
// non-Path2D canvas, so we need to keep it an explicit step.
function excavateModules(modules: Modules, excavation: Excavation): Modules {
    return modules.slice().map((row, y) => {
        if (y < excavation.y || y >= excavation.y + excavation.h) {
            return row;
        }
        return row.map((cell, x) => {
            if (x < excavation.x || x >= excavation.x + excavation.w) {
                return cell;
            }
            return false;
        });
    });
}

function getImageSettings(
    cells: Modules,
    size: number,
    margin: number,
    imageSettings?: ImageSettings
): null | {
    x: number;
    y: number;
    h: number;
    w: number;
    excavation: Excavation | null;
    opacity: number;
} {
    if (imageSettings == null) {
        return null;
    }
    const numCells = cells.length + margin * 2;
    const defaultSize = Math.floor(size * DEFAULT_IMG_SCALE);
    const scale = numCells / size;
    const w = (imageSettings.width || defaultSize) * scale;
    const h = (imageSettings.height || defaultSize) * scale;
    const x =
        imageSettings.x == null
            ? cells.length / 2 - w / 2
            : imageSettings.x * scale;
    const y =
        imageSettings.y == null
            ? cells.length / 2 - h / 2
            : imageSettings.y * scale;
    const opacity = imageSettings.opacity == null ? 1 : imageSettings.opacity;

    let excavation = null;
    if (imageSettings.excavate) {
        let floorX = Math.floor(x);
        let floorY = Math.floor(y);
        let ceilW = Math.ceil(w + x - floorX);
        let ceilH = Math.ceil(h + y - floorY);
        excavation = {x: floorX, y: floorY, w: ceilW, h: ceilH};
    }

    return {x, y, h, w, excavation, opacity};
}

function getMarginSize(includeMargin: boolean, marginSize?: number): number {
    if (marginSize != null) {
        return Math.floor(marginSize);
    }
    return includeMargin ? SPEC_MARGIN_SIZE : DEFAULT_MARGIN_SIZE;
}

function makeQRCode({
                        value,
                        level,
                        minVersion,
                    }: {
    value: string;
    level: string;
    minVersion: number;
}): qrcodegen.QrCode {
    const segments = qrcodegen.QrSegment.makeSegments(value);
    return qrcodegen.QrCode.encodeSegments(
        segments,
        ERROR_LEVEL_MAP[level],
        minVersion
    );
}

const QRCodeSVG = React.forwardRef(function QRCodeSVG(
    props: QRPropsSVG,
    forwardedRef: React.ForwardedRef<SVGSVGElement>
) {
    const {
        value,
        size = DEFAULT_SIZE,
        level = DEFAULT_LEVEL,
        bgColor = DEFAULT_BGCOLOR,
        fgColor = DEFAULT_FGCOLOR,
        includeMargin = DEFAULT_INCLUDEMARGIN,
        minVersion = DEFAULT_MINVERSION,
        title,
        marginSize,
        imageSettings,
        ...otherProps
    } = props;

    let qrcode = makeQRCode({
        value,
        level,
        minVersion,
    });
    let cells = qrcode.getModules();

    const margin = getMarginSize(includeMargin, marginSize);
    const numCells = cells.length + margin * 2;
    const calculatedImageSettings = getImageSettings(
        cells,
        size,
        margin,
        imageSettings
    );

    let image = null;
    if (imageSettings != null && calculatedImageSettings != null) {
        if (calculatedImageSettings.excavation != null) {
            cells = excavateModules(cells, calculatedImageSettings.excavation);
        }

        image = (
            <image
                xlinkHref={imageSettings.src}
                height={calculatedImageSettings.h}
                width={calculatedImageSettings.w}
                x={calculatedImageSettings.x + margin}
                y={calculatedImageSettings.y + margin}
                preserveAspectRatio="none"
                opacity={calculatedImageSettings.opacity}
            />
        );
    }

    const fgPath = generatePath(cells, margin);

    return (
        <Svg
            height={size}
            width={size}
            viewBox={`0 0 ${numCells} ${numCells}`}
            // @ts-ignore
            ref={forwardedRef}
            role="img"
            {...otherProps}>
            {!!title && <title>{title}</title>}
            <Path
                fill={bgColor}
                d={`M0,0 h${numCells}v${numCells}H0z`}
            />
            <Path fill={fgColor} d={fgPath} />
            {image}
        </Svg>
    );
});
QRCodeSVG.displayName = 'QRCodeSVG';

export {QRCodeSVG};