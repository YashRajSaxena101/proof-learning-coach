import { useId } from "react";
import type { CompanionMood } from "@/domain/companion/activity";
import { useMotionPref } from "@/lib/motion-pref";
import "./companion.css";

/** Original vector character: a small blue comet, carrying a scholar's satchel. */
export function ProofAvatar({
  mood = "idle",
  className = "",
}: {
  mood?: CompanionMood;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const { allowed } = useMotionPref();
  const asleep = mood === "asleep";
  return (
    <svg
      className={`proof-avatar ${className}`}
      data-mood={mood}
      data-motion={allowed ? "on" : "off"}
      viewBox="0 0 180 220"
      role="img"
      aria-label={`Proof, a friendly blue comet companion, ${mood}`}
    >
      <defs>
        <linearGradient id={`${id}-blue`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#84e4ff" />
          <stop offset=".5" stopColor="#49abed" />
          <stop offset="1" stopColor="#217bc4" />
        </linearGradient>
        <linearGradient id={`${id}-fire`} x1="0" y1="0" x2=".6" y2="1">
          <stop stopColor="#ffe08a" />
          <stop offset=".45" stopColor="#ffae42" />
          <stop offset="1" stopColor="#f36b36" />
        </linearGradient>
        <linearGradient id={`${id}-coat`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#71b789" />
          <stop offset="1" stopColor="#296653" />
        </linearGradient>
      </defs>
      <ellipse
        className="proof-avatar-shadow"
        cx="91"
        cy="207"
        rx="39"
        ry="7"
        fill="#06172b"
        opacity=".3"
      />
      <g className="proof-avatar-body">
        <path
          d="M54 92Q23 108 30 127Q49 119 57 108M130 90Q158 101 150 119Q137 116 125 107"
          fill="#45a8e5"
          stroke="#205d8d"
          strokeWidth="2"
        />
        <g className="proof-avatar-legs">
          <path
            d="M70 176l-4 23q9 10 23 1l1-24M99 176l1 23q15 8 24-2l-7-22"
            fill="#3189c9"
            stroke="#205d8d"
            strokeWidth="2"
          />
          <path
            d="M65 200q11 6 24 0M101 199q11 6 23-2"
            fill="none"
            stroke="#b4edff"
            strokeWidth="3"
          />
        </g>
        <path
          d="M68 129Q53 144 59 178q31 17 65-1 3-29-16-47"
          fill={`url(#${id}-coat)`}
          stroke="#245c4e"
          strokeWidth="2.5"
        />
        <path d="M72 130l19 16 17-16-5 34H80z" fill="#f0dfb6" />
        <path d="M88 142l-9-5v13l9-4 4 1 10 4v-14l-10 5z" fill="#315b58" />
        <circle cx="91" cy="160" r="2.5" fill="#f4cf72" />
        <circle cx="91" cy="173" r="2.5" fill="#f4cf72" />
        <g className="proof-avatar-arm-left">
          <path
            d="M65 140q-15 1-19 18l9 6 16-14"
            fill={`url(#${id}-coat)`}
            stroke="#245c4e"
            strokeWidth="2"
          />
          <ellipse
            cx="48"
            cy="163"
            rx="10"
            ry="11"
            fill={`url(#${id}-blue)`}
            stroke="#246b9d"
            strokeWidth="2"
          />
        </g>
        <g className="proof-avatar-arm-right">
          <path
            d="M117 141q16 3 19 17l-11 6-14-16"
            fill={`url(#${id}-coat)`}
            stroke="#245c4e"
            strokeWidth="2"
          />
          <ellipse
            cx="133"
            cy="164"
            rx="10"
            ry="11"
            fill={`url(#${id}-blue)`}
            stroke="#246b9d"
            strokeWidth="2"
          />
        </g>
        <path d="M66 133l57 51" stroke="#b58a50" strokeWidth="7" />
        <path d="M66 132l57 51" stroke="#ecd094" strokeWidth="2" />
        <g className="proof-avatar-satchel">
          <rect
            x="112"
            y="169"
            width="29"
            height="28"
            rx="6"
            fill="#a87945"
            stroke="#644c32"
            strokeWidth="2"
          />
          <path d="M112 174q14 14 29 0" fill="#c69860" stroke="#644c32" strokeWidth="2" />
          <rect x="124" y="177" width="6" height="9" rx="2" fill="#f6d17d" />
        </g>
        <g className="proof-avatar-head">
          <path
            d="M47 66Q31 55 36 43q15 5 24 11M122 55q14-18 26-17 1 21-13 30"
            fill="#3b9fdc"
            stroke="#205d8d"
            strokeWidth="2"
          />
          <path
            d="M40 89q-2-46 49-51 49-1 53 45 6 49-49 53-51 0-53-47"
            fill={`url(#${id}-blue)`}
            stroke="#206a9f"
            strokeWidth="2.5"
          />
          <path
            d="M52 74q-7-24 9-39 0 14 8 16Q65 24 91 9q-4 22 8 27 5-16 22-17-7 14 3 24 16 11 11 31-8-11-20-12 1 13-13 19-4-20-17-23-9 18-33 16"
            fill={`url(#${id}-fire)`}
            stroke="#d26932"
            strokeWidth="2"
          />
          <path
            className="proof-avatar-flame"
            d="M75 54q-4-14 10-29-2 16 10 23l-7 15z"
            fill="#ffe7a0"
            opacity=".9"
          />
          <ellipse cx="57" cy="107" rx="9" ry="5" fill="#dca08e" opacity=".5" />
          <ellipse cx="121" cy="107" rx="9" ry="5" fill="#dca08e" opacity=".5" />
          <g className="proof-avatar-eyes" style={{ transformOrigin: "90px 92px" }}>
            {asleep ? (
              <>
                <path
                  d="M58 94q9 9 18 0M104 94q9 9 18 0"
                  fill="none"
                  stroke="#23475e"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <ellipse cx="68" cy="94" rx="10" ry={mood === "happy" ? 10 : 13} fill="#173b55" />
                <ellipse cx="112" cy="94" rx="10" ry={mood === "happy" ? 10 : 13} fill="#173b55" />
                <g className="proof-avatar-pupils">
                  <ellipse cx="70" cy="96" rx="5" ry="7" fill="#b6874f" />
                  <ellipse cx="114" cy="96" rx="5" ry="7" fill="#b6874f" />
                  <circle cx="65" cy="89" r="4" fill="#f6fcff" />
                  <circle cx="109" cy="89" r="4" fill="#f6fcff" />
                  <circle cx="73" cy="99" r="1.7" fill="#f6fcff" />
                  <circle cx="117" cy="99" r="1.7" fill="#f6fcff" />
                </g>
              </>
            )}
          </g>
          <path
            d={
              mood === "sad" ? "M58 79q9 2 17-5M104 74q9 7 18 5" : "M58 78q9-5 18-1M104 77q9-4 18 1"
            }
            fill="none"
            stroke="#28688c"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {mood === "happy" ? (
            <path d="M78 112q12 18 25 0z" fill="#173b55" stroke="#173b55" strokeWidth="2" />
          ) : mood === "talking" ? (
            <ellipse className="proof-avatar-mouth" cx="91" cy="115" rx="6" ry="7" fill="#173b55" />
          ) : (
            <path
              d={
                mood === "sad"
                  ? "M82 119q9-8 18 0"
                  : asleep
                    ? "M86 116q5 4 10 0"
                    : "M81 113q10 9 20 0"
              }
              fill="none"
              stroke="#23475e"
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}
        </g>
        {asleep && (
          <g className="proof-avatar-zzz" fill="#b5e8fa" fontFamily="system-ui" fontWeight="700">
            <text x="141" y="65" fontSize="15">
              z
            </text>
            <text x="151" y="45" fontSize="20">
              z
            </text>
          </g>
        )}
        {mood === "happy" && (
          <g className="proof-avatar-spark" fill="#f8d378">
            <path d="M22 69l3 7 8 3-8 3-3 8-3-8-7-3 7-3zM151 103l2 5 6 2-6 2-2 6-2-6-5-2 5-2z" />
          </g>
        )}
      </g>
    </svg>
  );
}
