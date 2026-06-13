import Section from "@/comp/section/section";
import k from "./styles.module.scss";

export default function One({ content }: { content: string }) {
  return (
    <Section className={k.one}>
      <div
        dangerouslySetInnerHTML={{
          __html: content || "",
        }}
      />
    </Section>
  );
}
