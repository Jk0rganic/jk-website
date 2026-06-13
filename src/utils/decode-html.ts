export const decodeHTML = (htmlString: string): string => {
  if (!htmlString) return "";

  if (typeof window === "undefined") {
    return htmlString.replace(/<\/?[^>]+(>|$)/g, "");
  }

  const doc = new DOMParser().parseFromString(htmlString, "text/html");
  return doc.body.textContent ?? "";
};
