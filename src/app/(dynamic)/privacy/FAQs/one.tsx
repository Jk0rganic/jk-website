"use client";
import Section from "@/comp/section/section";
import React, { useState } from "react";
import k from "./styles.module.scss";

const faqs = [
  {
    q: "Are JK Organics products safe to use?",
    a: "Yes — your safety is our top priority. Our products are formulated with pure and high-quality ingredients that are safe and gentle for use.",
  },
  {
    q: "How long does it take to see results?",
    a: "Results vary depending on the product and the individual. Most customers notice improvements within 1–4 weeks with consistent use.",
  },
  {
    q: "Are your skincare products suitable for all skin types?",
    a: "Yes, our products are suitable for all skin types including dry, normal, combination, and oily skin. If you have sensitive skin, we recommend doing a patch test first.",
  },
  {
    q: "Can I use multiple products together?",
    a: "Absolutely — our products are formulated to complement each other for better results. Examples: Dark Spots Package, Acne Package, Glow Package, Weight Loss Package.",
  },
  {
    q: "Do your weight loss products have side effects?",
    a: "Yes — but they are mild. These may include suppressed appetite or bowel discomfort which may result in loose stool. If you have medical conditions, please consult a healthcare specialist before use.",
  },
  {
    q: "Do you offer delivery?",
    a: "Yes — we deliver nationwide. Delivery timelines depend on your location.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept M-Pesa and Cash on Delivery (selected locations).",
  },
  {
    q: "How can I contact customer support?",
    a: (
      <>
        Contact us on WhatsApp or call{" "}
        <a
          href="https://wa.me/254795782207"
          target="_blank"
          rel="noopener noreferrer"
          className={k.link}
        >
          +254 795 782 207
        </a>
      </>
    ),
  },
  {
    q: "Can I cancel my order?",
    a: "Yes, we offer a 7-day cancellation policy. Please contact us to cancel your order.",
  },
  {
    q: "What is your return policy?",
    a: "We accept returns within 7 days of delivery for unopened and unused products. Please contact our customer support for assistance.",
  },
  {
    q: "Do you have physical stores?",
    a: "Yes, we operate a physical store at Stanbank House, Moi Avenue, adjacent to the National Archives, 6th Floor, Shop B613.",
  },
];

export default function One() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggle = (index: any) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <Section className={k.faqs}>
      <h2 className={k.title}>Frequently Asked Questions</h2>

      <div className={k.faq_list}>
        {faqs.map((item, index) => (
          <div key={index as number} className={k.faq_item}>
            <button
              type="button"
              className={k.faq_question}
              onClick={() => toggle(index)}
            >
              <span className={k.icon}>
                {activeIndex === index ? "−" : "+"}
              </span>
              <span>{item.q}</span>
            </button>

            {activeIndex === index && <p className={k.faq_answer}>{item.a}</p>}
          </div>
        ))}
      </div>
    </Section>
  );
}
