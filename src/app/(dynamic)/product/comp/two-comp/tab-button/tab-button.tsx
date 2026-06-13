import React from "react";
import k from "./styles.module.scss";

interface TabButtonProps {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  reviews_count: number;
}

export default function TabButton({
  activeTab,
  setActiveTab,
  reviews_count,
}: TabButtonProps) {
  return (
    <div className={k.tab_button}>
      <button
        type="button"
        className={activeTab === "description" ? k.active : ""}
        onClick={() => setActiveTab("description")}
      >
        Description
      </button>
      <button
        type="button"
        className={activeTab === "additional" ? k.active : ""}
        onClick={() => setActiveTab("additional")}
      >
        Additional Information
      </button>
      <button
        type="button"
        className={activeTab === "reviews" ? k.active : ""}
        onClick={() => setActiveTab("reviews")}
      >
        Reviews <span>{reviews_count}</span>
      </button>
    </div>
  );
}
