// Import icons from lucide-react
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import {
  SharedEmail,
  SharedPhone,
} from "@/comp/shared-components/shared-components";
import Section from "../../comp/section/section";
import ContactForm from "./comp/contact-form/contact-form";
import k from "./styles.module.scss";

export default function One() {
  const contactData = [
    {
      icon: <MapPin size={20} />,
      type: "text",
      value:
        "STANBANK House, Moi Avenue, next to ARCHIVES, 6th fl, shop B613, NAIROBI",
    },
    {
      icon: <Phone size={20} />,
      type: "component",
      node: <SharedPhone />,
    },
    {
      icon: <Mail size={20} />,
      type: "component",
      node: <SharedEmail />,
    },
    {
      icon: <Clock size={20} />,
      type: "text",
      value: "Monday–Saturday: 8:00 AM – 1:00 PM",
    },
  ];

  return (
    <Section className={k.one}>
      <h3>Get in Touch</h3>
      <div className={k.container}>
        <ContactForm />

        <div className={k.info}>
          <h4>Contact Information</h4>
          <ul>
            {contactData.map((item, index) => (
              <li key={index}>
                <h5 className={k.icon}>{item.icon}</h5>

                {item.type === "text" && <p className={k.text}>{item.value}</p>}

                {item.type === "component" && (
                  <div className={k.text}>{item.node}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
