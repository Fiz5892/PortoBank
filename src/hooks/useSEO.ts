import { useEffect } from "react";

interface SEOOptions {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  canonical?: string;
}

const upsertMeta = (selector: string, attr: "name" | "property", key: string, value: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
};

const upsertLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
};

/**
 * Lightweight SEO hook — updates document.title, meta description,
 * and Open Graph / Twitter tags on mount and when inputs change.
 */
export const useSEO = ({
  title,
  description,
  image,
  type = "website",
  canonical,
}: SEOOptions) => {
  useEffect(() => {
    if (title) document.title = title;

    if (description) {
      upsertMeta('meta[name="description"]', "name", "description", description);
      upsertMeta('meta[property="og:description"]', "property", "og:description", description);
      upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    }

    if (title) {
      upsertMeta('meta[property="og:title"]', "property", "og:title", title);
      upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    }

    upsertMeta('meta[property="og:type"]', "property", "og:type", type);

    if (image) {
      upsertMeta('meta[property="og:image"]', "property", "og:image", image);
      upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", image);
      upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    }

    const url = canonical ?? window.location.href;
    upsertMeta('meta[property="og:url"]', "property", "og:url", url);
    upsertLink("canonical", url);
  }, [title, description, image, type, canonical]);
};
