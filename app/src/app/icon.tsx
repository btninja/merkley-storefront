import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Read brand config from env or defaults
const brandColor = process.env.NEXT_PUBLIC_BRAND_COLOR || "#ffa8b7";
const brandLetter = (process.env.NEXT_PUBLIC_APP_NAME || "M")[0].toUpperCase();

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          background: brandColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 20,
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
