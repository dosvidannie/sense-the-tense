import type { TenseId, TopicId } from "./game-types";
import type { ReviewHistory } from "./review-schedule";

type Action = { base: string; third: string; past: string; participle: string; ing: string; ru: string };

const ACTIONS: Record<TopicId, Action[]> = {
  everyday: [
    { base: "sort the old photos", third: "sorts the old photos", past: "sorted the old photos", participle: "sorted the old photos", ing: "sorting the old photos", ru: "разбирать старые фотографии" },
    { base: "redecorate the living room", third: "redecorates the living room", past: "redecorated the living room", participle: "redecorated the living room", ing: "redecorating the living room", ru: "обновлять гостиную" },
    { base: "organise the kitchen shelves", third: "organises the kitchen shelves", past: "organised the kitchen shelves", participle: "organised the kitchen shelves", ing: "organising the kitchen shelves", ru: "разбирать полки на кухне" },
  ],
  work: [
    { base: "draft the client proposal", third: "drafts the client proposal", past: "drafted the client proposal", participle: "drafted the client proposal", ing: "drafting the client proposal", ru: "готовить предложение для клиента" },
    { base: "review the project notes", third: "reviews the project notes", past: "reviewed the project notes", participle: "reviewed the project notes", ing: "reviewing the project notes", ru: "проверять заметки по проекту" },
    { base: "update the weekly report", third: "updates the weekly report", past: "updated the weekly report", participle: "updated the weekly report", ing: "updating the weekly report", ru: "обновлять еженедельный отчёт" },
  ],
  people: [
    { base: "plan a birthday dinner", third: "plans a birthday dinner", past: "planned a birthday dinner", participle: "planned a birthday dinner", ing: "planning a birthday dinner", ru: "планировать праздничный ужин" },
    { base: "write a thoughtful reply", third: "writes a thoughtful reply", past: "wrote a thoughtful reply", participle: "written a thoughtful reply", ing: "writing a thoughtful reply", ru: "писать вдумчивый ответ" },
    { base: "organise a friends' reunion", third: "organises a friends' reunion", past: "organised a friends' reunion", participle: "organised a friends' reunion", ing: "organising a friends' reunion", ru: "организовывать встречу друзей" },
  ],
  travel: [
    { base: "plan the train journey", third: "plans the train journey", past: "planned the train journey", participle: "planned the train journey", ing: "planning the train journey", ru: "планировать поездку на поезде" },
    { base: "pack a small suitcase", third: "packs a small suitcase", past: "packed a small suitcase", participle: "packed a small suitcase", ing: "packing a small suitcase", ru: "собирать небольшой чемодан" },
    { base: "check the flight details", third: "checks the flight details", past: "checked the flight details", participle: "checked the flight details", ing: "checking the flight details", ru: "проверять детали перелёта" },
  ],
  digital: [
    { base: "back up the project files", third: "backs up the project files", past: "backed up the project files", participle: "backed up the project files", ing: "backing up the project files", ru: "сохранять резервную копию файлов" },
    { base: "edit the short video", third: "edits the short video", past: "edited the short video", participle: "edited the short video", ing: "editing the short video", ru: "монтировать короткое видео" },
    { base: "fix the website layout", third: "fixes the website layout", past: "fixed the website layout", participle: "fixed the website layout", ing: "fixing the website layout", ru: "править вёрстку сайта" },
  ],
  plans: [
    { base: "prepare for the interview", third: "prepares for the interview", past: "prepared for the interview", participle: "prepared for the interview", ing: "preparing for the interview", ru: "готовиться к собеседованию" },
    { base: "plan the next workshop", third: "plans the next workshop", past: "planned the next workshop", participle: "planned the next workshop", ing: "planning the next workshop", ru: "планировать следующий воркшоп" },
    { base: "revise the study notes", third: "revises the study notes", past: "revised the study notes", participle: "revised the study notes", ing: "revising the study notes", ru: "повторять учебные записи" },
  ],
};

const PEOPLE = ["Alex", "Maya", "Daniel", "Nora", "Sam", "Lena", "Chris", "Eva", "Leo", "Mia"];
const ROLES = ["the design team", "the studio", "the neighbourhood", "the book club", "the workshop", "the local team", "the community group", "the study group", "the travel club", "the art school"];
const ROLES_RU = ["дизайн-команды", "студии", "соседского сообщества", "книжного клуба", "мастерской", "местной команды", "сообщества", "учебной группы", "клуба путешественников", "школы искусств"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAYS_RU = ["понедельникам", "вторникам", "средам", "четвергам", "пятницам", "субботам", "воскресеньям"];
const DURATIONS = ["forty minutes", "two hours", "three hours", "half an hour", "four hours", "an hour"];
const DURATIONS_RU = ["сорок минут", "два часа", "три часа", "полчаса", "четыре часа", "час"];
const TIMES = ["8 a.m.", "10 a.m.", "noon", "2 p.m.", "4 p.m.", "7 p.m."];
const TIMES_RU = ["8:00", "10:00", "полдень", "14:00", "16:00", "19:00"];
const PAST = ["yesterday afternoon", "last Friday", "two days ago", "last night", "yesterday morning", "last weekend"];
const PAST_RU = ["вчера днём", "в прошлую пятницу", "два дня назад", "прошлой ночью", "вчера утром", "в прошлые выходные"];
const DEADLINES = ["tomorrow evening", "next Friday", "the end of the week", "next Monday", "the next meeting", "noon tomorrow"];
const DEADLINES_RU = ["завтрашнему вечеру", "следующей пятнице", "концу недели", "следующему понедельнику", "следующей встрече", "завтрашнему полудню"];
const EARLIER = ["the meeting began", "the call started", "the team arrived", "the deadline passed", "the manager asked", "the event started"];
const EARLIER_RU = ["началась встреча", "начался звонок", "пришла команда", "истёк срок", "менеджер спросил", "началось событие"];
const NOW = ["right now", "at the moment", "as we speak", "right now before the call", "at this very moment", "right now while everyone waits"];
const NOW_RU = ["прямо сейчас", "в данный момент", "пока мы говорим", "перед звонком прямо сейчас", "именно в этот момент", "пока все ждут"];
const RESULT = ["so we can move on now", "and the result is visible now", "so the team can check it", "and the result matters now", "so there is nothing left to do", "and it is ready for review"];
const RESULT_RU = ["теперь можно двигаться дальше", "результат уже виден", "команда может его проверить", "результат нужен сейчас", "ничего доделывать не нужно", "всё готово к проверке"];
const FUTURE = ["tomorrow", "next week", "this weekend", "on Friday", "tomorrow afternoon", "next Monday"];
const FUTURE_RU = ["завтра", "на следующей неделе", "в эти выходные", "в пятницу", "завтра днём", "в следующий понедельник"];

export type SpotExercise = {
  id: string;
  tense: TenseId;
  topic: TopicId;
  situation: string;
  sentence: string;
  correctSentence: string;
  parts: string[];
  targetIndex: number;
  options: string[];
  correctFragment: string;
  isClean: boolean;
  hint: string;
  explanation: string;
};

const GUIDES: Record<TenseId, { hint: string; explanation: string }> = {
  "present-simple": { hint: "Обрати внимание: это привычка или действие именно сейчас?", explanation: "Регулярное действие требует Present Simple; форма процесса изменила бы смысл." },
  "present-continuous": { hint: "Посмотри, в какой момент происходит действие.", explanation: "Действие происходит прямо сейчас, поэтому нужна форма Present Continuous." },
  "present-perfect": { hint: "Здесь важен результат сейчас или конкретный момент в прошлом?", explanation: "Результат важен сейчас, поэтому подходит Present Perfect, а не форма, привязанная к прошлому событию." },
  "present-perfect-continuous": { hint: "Процесс уже закончился или всё ещё длится?", explanation: "Процесс начался раньше и продолжается сейчас; длительность передаёт Present Perfect Continuous." },
  "past-simple": { hint: "Найди указание на завершённый момент в прошлом.", explanation: "Конкретное завершённое прошлое требует Past Simple; Present Perfect с таким маркером не сочетается." },
  "past-continuous": { hint: "Что уже происходило, когда случилось другое событие?", explanation: "Фоновый процесс в прошлом передаёт Past Continuous, а короткое событие — Past Simple." },
  "past-perfect": { hint: "Какое из двух прошлых событий произошло раньше?", explanation: "Действие завершилось до другого события в прошлом, поэтому нужна форма Past Perfect." },
  "past-perfect-continuous": { hint: "Важна длительность до другого момента в прошлом.", explanation: "Продолжительность процесса до прошлого события передаёт Past Perfect Continuous." },
  "future-simple": { hint: "Здесь прогноз о будущем или уже случившийся факт?", explanation: "Простой прогноз о будущем передаёт Future Simple; завершённая форма прошлого с будущим маркером не подходит." },
  "future-continuous": { hint: "Представь действие в процессе в конкретный будущий момент.", explanation: "В определённый момент будущего действие будет идти; здесь нужен Future Continuous." },
  "future-perfect": { hint: "К будущему сроку результат уже будет готов?", explanation: "Завершение к будущему сроку передаёт Future Perfect." },
  "future-perfect-continuous": { hint: "Посмотри из будущего на длительность процесса.", explanation: "К будущему сроку накопится определённая длительность процесса; это Future Perfect Continuous." },
};

function groups(text: string): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const result: string[] = [];
  for (let index = 0; index < words.length; index += 2) result.push(words.slice(index, index + 2).join(" "));
  return result;
}

export function createSpotExercise(tense: TenseId, topic: TopicId, serial: number, isClean: boolean): SpotExercise {
  const personName = PEOPLE[serial % PEOPLE.length];
  const action = ACTIONS[topic][Math.floor(serial / PEOPLE.length) % ACTIONS[topic].length];
  const scene = Math.floor(serial / (PEOPLE.length * ACTIONS[topic].length)) % 6;
  const generation = Math.floor(serial / (PEOPLE.length * ACTIONS[topic].length * 6));
  const role = generation === 0 ? "" : generation <= ROLES.length
    ? ` from ${ROLES[generation - 1]}`
    : ` from project team ${generation - ROLES.length}`;
  const person = `${personName}${role}`;
  const day = DAYS[scene];
  const duration = DURATIONS[scene];
  const time = TIMES[scene];
  const past = PAST[scene];
  const deadline = DEADLINES[scene];
  const earlier = EARLIER[scene];
  const now = NOW[scene];
  let before = "";
  let after = ".";
  let situation = "";
  let correct = "";
  let wrong = "";
  let distractors: string[] = [];

  switch (tense) {
    case "present-simple":
      before = `${person} `; after = ` every ${day}.`;
      situation = `Задача «${action.ru}» повторяется в расписании ${personName} по ${DAYS_RU[scene]}.`;
      correct = action.third; wrong = `was ${action.ing}`;
      distractors = [`has ${action.participle}`, `will ${action.base}`]; break;
    case "present-continuous":
      before = `${person} `; after = ` ${now}.`;
      situation = `${NOW_RU[scene]} идёт работа над задачей «${action.ru}».`;
      correct = `is ${action.ing}`; wrong = `had ${action.participle}`;
      distractors = [`was ${action.ing}`, `will ${action.base}`]; break;
    case "present-perfect":
      before = `${person} `; after = `, ${RESULT[scene]}.`;
      situation = `Задача «${action.ru}» уже выполнена; ${RESULT_RU[scene]}.`;
      correct = `has already ${action.participle}`; wrong = `had already ${action.participle}`;
      distractors = [`was ${action.ing}`, `will have ${action.participle}`]; break;
    case "present-perfect-continuous":
      before = `${person} `; after = ` for ${duration}, and is still working on it.`;
      situation = `${personName} занимается задачей «${action.ru}» уже ${DURATIONS_RU[scene]} и всё ещё продолжает.`;
      correct = `has been ${action.ing}`; wrong = `had been ${action.ing}`;
      distractors = [`was ${action.ing}`, `will be ${action.ing}`]; break;
    case "past-simple":
      before = `${person} `; after = ` ${past}.`;
      situation = `Задача «${action.ru}» была полностью завершена ${PAST_RU[scene]}.`;
      correct = action.past; wrong = `has ${action.participle}`;
      distractors = [`is ${action.ing}`, `will ${action.base}`]; break;
    case "past-continuous":
      before = `At ${time} yesterday, ${person} `; after = " when a message arrived.";
      situation = `Вчера в ${TIMES_RU[scene]} шла работа над задачей «${action.ru}», когда пришло сообщение.`;
      correct = `was ${action.ing}`; wrong = `has been ${action.ing}`;
      distractors = [`is ${action.ing}`, `will be ${action.ing}`]; break;
    case "past-perfect":
      before = `Before ${earlier}, ${person} `; after = ".";
      situation = `До того как ${EARLIER_RU[scene]}, задача «${action.ru}» уже была завершена.`;
      correct = `had already ${action.participle}`; wrong = `has already ${action.participle}`;
      distractors = [`will have ${action.participle}`, `is ${action.ing}`]; break;
    case "past-perfect-continuous":
      before = `${person} `; after = ` for ${duration} before ${earlier}.`;
      situation = `До того как ${EARLIER_RU[scene]}, работа над задачей «${action.ru}» шла уже ${DURATIONS_RU[scene]}.`;
      correct = `had been ${action.ing}`; wrong = `has been ${action.ing}`;
      distractors = [`is ${action.ing}`, `will be ${action.ing}`]; break;
    case "future-simple":
      before = `I think ${person} `; after = ` ${FUTURE[scene]}.`;
      situation = `Прогноз: ${personName}, вероятно, займётся задачей «${action.ru}» ${FUTURE_RU[scene]}.`;
      correct = `will ${action.base}`; wrong = `has ${action.participle}`;
      distractors = [`had ${action.participle}`, `was ${action.ing}`]; break;
    case "future-continuous":
      before = `At ${time} tomorrow, ${person} `; after = ".";
      situation = `Завтра в ${TIMES_RU[scene]} будет идти работа над задачей «${action.ru}».`;
      correct = `will be ${action.ing}`; wrong = `has been ${action.ing}`;
      distractors = [`had been ${action.ing}`, `was ${action.ing}`]; break;
    case "future-perfect":
      before = `By ${deadline}, ${person} `; after = ".";
      situation = `К ${DEADLINES_RU[scene]} ${personName} уже закончит задачу «${action.ru}».`;
      correct = `will have ${action.participle}`; wrong = `has ${action.participle}`;
      distractors = [`had ${action.participle}`, `is ${action.ing}`]; break;
    case "future-perfect-continuous":
      before = `By ${deadline}, ${person} `; after = ` for ${duration}.`;
      situation = `К ${DEADLINES_RU[scene]} ${personName} будет заниматься задачей «${action.ru}» уже ${DURATIONS_RU[scene]}.`;
      correct = `will have been ${action.ing}`; wrong = `has been ${action.ing}`;
      distractors = [`had been ${action.ing}`, `was ${action.ing}`]; break;
  }

  const displayed = isClean ? correct : wrong;
  const beforeParts = groups(before);
  const afterParts = groups(after.startsWith(", ") ? after.slice(2) : after);
  if (after === ".") afterParts.splice(0, 1);
  const punctuation = after === "." ? "." : after.startsWith(", ") ? "," : "";
  const parts = [...beforeParts, `${displayed}${punctuation}`, ...afterParts];
  const scenario = `${situation.includes(personName) ? "" : `${personName}: `}${situation}${generation > 0 ? ` Участник — ${personName} из ${generation <= ROLES_RU.length ? ROLES_RU[generation - 1] : `проектной команды №${generation - ROLES_RU.length}`}.` : ""}`;
  return {
    id: `spot-${tense}-${topic}-${serial}-${isClean ? "clean" : "error"}`,
    tense, topic, situation: scenario,
    sentence: `${before}${displayed}${after}`,
    correctSentence: `${before}${correct}${after}`,
    parts,
    targetIndex: beforeParts.length,
    options: [correct, ...distractors],
    correctFragment: correct,
    isClean,
    ...GUIDES[tense],
  };
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

export function buildSpotDeck(
  count: number,
  tenseIds: TenseId[],
  topicIds: TopicId[],
  history: ReviewHistory<SpotExercise>,
  serialState: Partial<Record<TenseId, number>>,
  now: number,
): { exercises: SpotExercise[]; nextSerialState: Partial<Record<TenseId, number>> } {
  const due = shuffle(Object.values(history).filter((record) => Number.isFinite(record.nextEligibleAt) && record.nextEligibleAt <= now))
    .filter((record) => tenseIds.includes(record.card.tense) && topicIds.includes(record.card.topic))
    .slice(0, Math.floor(count * 0.2))
    .map((record) => record.card);
  const reviewSlots = new Set(shuffle(Array.from({ length: count }, (_, index) => index)).slice(0, due.length));
  const freshSlots = Array.from({ length: count }, (_, index) => index).filter((index) => !reviewSlots.has(index));
  const neededClean = Math.max(0, Math.round(count * 0.2) - due.filter((exercise) => exercise.isClean).length);
  const cleanSlots = new Set(shuffle(freshSlots).slice(0, neededClean));
  const tenseOrder = shuffle(tenseIds);
  const nextSerialState = { ...serialState };
  const used = new Set<string>();
  const exercises: SpotExercise[] = [];
  for (let index = 0; index < count; index += 1) {
    let exercise = reviewSlots.has(index) ? due.pop() : undefined;
    if (!exercise || used.has(exercise.id)) {
      const tense = tenseOrder[index % tenseOrder.length];
      const topic = topicIds[Math.floor(index / tenseOrder.length) % topicIds.length];
      let serial = nextSerialState[tense] ?? 0;
      exercise = createSpotExercise(tense, topic, serial, cleanSlots.has(index));
      while (history[exercise.id] || used.has(exercise.id)) {
        serial += 1;
        exercise = createSpotExercise(tense, topic, serial, cleanSlots.has(index));
      }
      nextSerialState[tense] = serial + 1;
    }
    used.add(exercise.id);
    exercises.push({ ...exercise, options: shuffle(exercise.options) });
  }
  return { exercises, nextSerialState };
}
