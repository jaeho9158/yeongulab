import { describe, it, expect } from "vitest";
import { articleJsonLd, breadcrumbJsonLd, serializeJsonLd } from "../jsonLd";

describe("articleJsonLd", () => {
  it("필수 필드를 채우고 mainEntityOfPage/URL이 절대경로다", () => {
    const schema = articleJsonLd({
      title: "제목",
      description: "설명",
      updated: "2026-08-30",
      path: "/articles/faq",
    }) as Record<string, unknown>;

    expect(schema["@type"]).toBe("Article");
    expect(schema.headline).toBe("제목");
    expect(schema.description).toBe("설명");
    expect(schema.inLanguage).toBe("ko");

    const mainEntity = schema.mainEntityOfPage as { "@id": string };
    expect(mainEntity["@id"]).toMatch(/^https?:\/\/.+\/articles\/faq$/);
  });

  it("발행일을 따로 추적하지 않으므로 datePublished/dateModified가 같은 값(updated)이다", () => {
    const schema = articleJsonLd({
      title: "t",
      description: "d",
      updated: "2026-01-05",
      path: "/articles/x",
    }) as Record<string, unknown>;
    expect(schema.datePublished).toBe("2026-01-05");
    expect(schema.dateModified).toBe("2026-01-05");
  });

  it("author/publisher가 각각 Person/Organization이다 (경계)", () => {
    const schema = articleJsonLd({
      title: "t",
      description: "d",
      updated: "2026-01-05",
      path: "/articles/x",
    }) as Record<string, unknown>;
    expect((schema.author as { "@type": string })["@type"]).toBe("Person");
    expect((schema.publisher as { "@type": string })["@type"]).toBe(
      "Organization",
    );
  });
});

describe("breadcrumbJsonLd", () => {
  it("position이 1부터 순서대로 증가하고 URL이 절대경로다", () => {
    const schema = breadcrumbJsonLd([
      { name: "홈", url: "/" },
      { name: "자료실", url: "/articles" },
      { name: "FAQ", url: "/articles/faq" },
    ]) as { itemListElement: { position: number; item: string }[] };

    expect(schema.itemListElement.map((i) => i.position)).toEqual([1, 2, 3]);
    schema.itemListElement.forEach((i) => {
      expect(i.item).toMatch(/^https?:\/\//);
    });
    expect(schema.itemListElement[2].item).toMatch(/\/articles\/faq$/);
  });

  it("항목이 하나뿐이어도 position 1 (경계)", () => {
    const schema = breadcrumbJsonLd([{ name: "홈", url: "/" }]) as {
      itemListElement: { position: number }[];
    };
    expect(schema.itemListElement).toHaveLength(1);
    expect(schema.itemListElement[0].position).toBe(1);
  });
});

describe("serializeJsonLd", () => {
  it("'<'를 유니코드 이스케이프로 바꾼다 (XSS 방지)", () => {
    const result = serializeJsonLd({ headline: "<script>alert(1)</script>" });
    expect(result).not.toContain("<");
    expect(result).toContain("\\u003cscript>alert(1)\\u003c/script>");
  });

  it("일반 문자열은 JSON.stringify와 동일하게 나온다 (실패하지 않는 정상 경로)", () => {
    const obj = { a: 1, b: "text" };
    expect(serializeJsonLd(obj)).toBe(JSON.stringify(obj));
  });
});
