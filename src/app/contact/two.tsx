"use client";

import React from "react";
import Section from "@/comp/section/section";

export default function Two() {
  return (
    <Section>
      <iframe
        width="100%"
        height="550"
        frameBorder="0"
        style={{ border: 0 }}
        src="https://www.google.com/maps/embed/v1/place?key=AIzaSyB2NIWI3Tv9iDPrlnowr_0ZqZWoAQydKJU&q=Kimathi+House,3rd+floor,room+303,shop+G&maptype=roadmap"
        allowFullScreen
      ></iframe>
    </Section>
  );
}
