import { DateType } from "@/types";

export function formatDate(d: DateType) {
  if (d.length === 1) return new Date();

  const month = new Date(Date.parse(d[0] + " 1, 2000")).getMonth();
  const year = d[1] as number;
  return new Date(year, month);
}

export function formatText(text: string) {
  text = text.replaceAll(/%A%/gi, getAge("2002/05/22"));
  text = text.replaceAll(/%G%/gi, getLocalGreeting());
  text = text.replaceAll(/##/gi, "");
  text = text.replaceAll(/<[^>]+>/gi, "");
  return text;
}

export function formatTextToHtml(text: string) {
  let result: string[] = [];

  text = text.replaceAll(/%A%/gi, getAge("2002/05/22"));
  text = text.replaceAll(/%G%/gi, getLocalGreeting(window.navigator.languages));
  const highlights = text.split("##");
  const punctuation = [".", ",", "?", ":", ";", '"', "'", "(", ")"];
  const words: { string: string; isHighlighted: boolean }[] = [];

  let highlighted = false;
  for (const h of highlights) {
    const currWords = h.trim().split(" ");
    currWords.forEach((word) => words.push({ string: word, isHighlighted: highlighted }));
    highlighted = !highlighted;
  }

  let i = 0;
  while (i < words.length) {
    const nextWordIsPunctuation = i + 1 < words.length && punctuation.includes(words[i + 1].string);
    result.push(
      "<span" +
        (words[i].isHighlighted ? " class='accent'" : "") +
        ">" +
        "&nbsp;" +
        words[i].string +
        "</span>" +
        (nextWordIsPunctuation ? "<span" + (words[i + 1].isHighlighted ? " class='accent'" : "") + ">" + words[i + 1].string + "</span>" : "")
    );
    i += nextWordIsPunctuation ? 2 : 1;
  }

  return result;
}

function getAge(date: string): string {
  const birthday = new Date(date);
  const difference = Date.now() - birthday.getTime();
  const ageDate = new Date(difference);

  return Math.abs(ageDate.getUTCFullYear() - 1970).toString();
}

function getLocalGreeting(languages: readonly string[] = []) {
  let language = "en";

  for (const lang of languages) {
    if (lang.slice(0, 2) !== "en") {
      language = lang.slice(0, 2);
      break;
    }
  }

  switch (language) {
    case "en":
      return "Hi";
    case "ar":
    case "ur":
    case "fa":
    case "ps":
    case "sy":
      return "Salam&nbsp;Alaykum";
    case "tr":
      return "Selam";
    case "es":
    case "ca":
    case "gl":
      return "Hola";
    case "cy":
      return "Helo";
    case "de":
      return "Hallo";
    case "zh":
      return "Ni&nbsp;Hao";
    case "fr":
    case "ro":
      return "Salut";
    case "ja":
      return "Konnichiwa";
    case "th":
      return "Sawasdee";
    case "it":
      return "Ciao";
    case "hi":
    case "sa":
      return "Namaste";
    case "ru":
      return "Privyet";
    case "uk":
      return "Pryvit";
    case "pt":
      return "Olá";
    case "pa":
      return "Sata&nbsp;Sri&nbsp;Akala";
    case "id":
      return "Halo";
    case "vi":
      return "Xin&nbsp;Chào";
    case "tl":
      return "Kumusta&nbsp;Kayo";
    case "ko":
      return "Annyeonghaseyo";
    case "pl":
      return "Czesc";
    case "he":
      return "Shalom";
    case "nl":
      return "Hoi";
    case "cs":
    case "sk":
      return "Ahoj";
    case "el":
      return "Yiasoo";
    case "sv":
    case "da":
      return "Hej";
    case "fi":
    case "nb":
      return "Hei";
    case "hr":
      return "Bok";
    case "hu":
      return "Sziasztok";
    case "eu":
      return "Kaixo";
    case "bg":
      return "Zdrasti";
    case "bs":
    case "sr":
    case "sl":
      return "Zdravo";
    case "mn":
      return "Zolgokh";
    case "sq":
      return "Përshëndetje";
    case "sw":
      return "Habari";
    case "be":
      return "Dobry dzien";
    default:
      return "Hello";
  }
}
