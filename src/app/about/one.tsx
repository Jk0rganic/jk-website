import {
  SharedEmail,
  SharedPhone,
} from "@/comp/shared-components/shared-components";
import k from "./styles.module.scss";
import Section from "@/comp/section/section";
export default function One() {
  return (
    <Section className={k.one}>
      <div className={k.content}>
        <h4>Address</h4>
        <p>
          STANBANK House , moi avenue,next to ARCHIVES 6th fr, shop b613,
          NAIROBI
        </p>
        <p>
          Monday – friday, 9.00am – 6.00pm
          <br />
          Saturday, 9.00am – 4.00pm
          <br />
          Sunday, Closed
        </p>
        <h4>Phone</h4>
        <SharedPhone />

        <h4>Email</h4>
        <SharedEmail />
      </div>
      <iframe
        title="map"
        width="100%"
        height="400"
        frameBorder="0"
        style={{ border: 0 }}
        src="https://www.google.com/maps/embed/v1/place?key=AIzaSyB2NIWI3Tv9iDPrlnowr_0ZqZWoAQydKJU&q=Kimathi+House,3rd+floor,room+303,shop+G&maptype=roadmap"
        allowFullScreen
        loading="lazy"
      ></iframe>
    </Section>
  );
}
