const pickAnimationStyles = {
    win: {
        animation: "fadeIn 0.8s ease-in-out",
    },
    loss: {
        animation: "shake 0.8s ease-in-out",
    },
    push: {
        animation: "pushPulse 3s ease-in-out infinite",
    },
    default: {
        animation: "defaultFade 0.8s ease-out",
    },
};

// CSS keyframes
const keyframes = `
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.5); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  50% { transform: translateX(6px); }
  75% { transform: translateX(-6px); }
  100% { transform: translateX(0); }
}

@keyframes pushPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.25); }
  100% { transform: scale(1); }
}

@keyframes defaultFade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
`;

// inject keyframes once
if (typeof document !== "undefined" && !document.getElementById("pick-anim-styles")) {
    const styleTag = document.createElement("style");
    styleTag.id = "pick-anim-styles";
    styleTag.innerHTML = keyframes;
    document.head.appendChild(styleTag);
}

export default pickAnimationStyles;