import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const brandColor = process.env.NEXT_PUBLIC_BRAND_COLOR || "#ffa8b7";
const brandLetter = (process.env.NEXT_PUBLIC_APP_NAME || "M")[0].toUpperCase();

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 36,
          background: brandColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 115,
            fontWeight: 700,
            color: "white",
            fontFamily: "Georgia, serif",
            lineHeight: 1,
          }}
        >
          {brandLetter}
        </span>
      </div>
    ),
    { ...size }
  );
}
