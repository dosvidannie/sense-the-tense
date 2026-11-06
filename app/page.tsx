"use client";

import { useEffect, useRef, useState } from "react";
import { dueReviews, recordReview, type ReviewHistory } from "./review-schedule";
import type { ModeId, TenseId, TopicId } from "./game-types";
import { recentAttempts, summarizeTenses, trimAttemptHistory, type AttemptEvent } from "./practice-analytics";
import { buildSpotDeck, type SpotExercise } from "./spot-error";

type Card = {
  id: string;
  title: string;
  tense: TenseId;
  topic: TopicId;
  humorous: boolean;
  situation: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  contrast: string;
  marker: string;
  hint: string;
};

type DeckCard = Card & {
  roundId: string;
};

type AnswerRecord = {
  card: DeckCard;
  correct: boolean;
  selectedIndex: number;
  saved: boolean;
};

type SpotAnswerRecord = {
  exercise: SpotExercise;
  correct: boolean;
  skipped: boolean;
  errorStage?: "find" | "replace";
  saved: boolean;
};

type SerialState = Partial<Record<TenseId, number>>;

type ProgressStats = {
  answered: number;
  correct: number;
};

type SceneAction = {
  base: string;
  third: string;
  ing: string;
  past: string;
  participle: string;
  ruInfinitive: string;
};

const TENSES: { id: TenseId; label: string; group: string }[] = [
  { id: "present-simple", label: "Present Simple", group: "Present" },
  { id: "present-continuous", label: "Present Continuous", group: "Present" },
  { id: "present-perfect", label: "Present Perfect", group: "Present" },
  {
    id: "present-perfect-continuous",
    label: "Present Perfect Continuous",
    group: "Present",
  },
  { id: "past-simple", label: "Past Simple", group: "Past" },
  { id: "past-continuous", label: "Past Continuous", group: "Past" },
  { id: "past-perfect", label: "Past Perfect", group: "Past" },
  {
    id: "past-perfect-continuous",
    label: "Past Perfect Continuous",
    group: "Past",
  },
  { id: "future-simple", label: "Future Simple", group: "Future" },
  { id: "future-continuous", label: "Future Continuous", group: "Future" },
  { id: "future-perfect", label: "Future Perfect", group: "Future" },
  {
    id: "future-perfect-continuous",
    label: "Future Perfect Continuous",
    group: "Future",
  },
];

const TOPICS: { id: TopicId; label: string }[] = [
  { id: "everyday", label: "Everyday life" },
  { id: "work", label: "Work & study" },
  { id: "people", label: "People & chats" },
  { id: "travel", label: "Travel" },
  { id: "digital", label: "Digital life" },
  { id: "plans", label: "Feelings & plans" },
];

const CARDS: Card[] = [
  {
    id: "ps-milk",
    title: "The Weekly Mystery",
    tense: "present-simple",
    topic: "everyday",
    humorous: true,
    situation:
      "Твой сосед каждую пятницу обещает купить молоко, но почему-то возвращается только с чипсами.",
    prompt: "Which sentence describes this regular little mystery?",
    options: [
      "My flatmate always promises to buy milk, but comes home with crisps.",
      "My flatmate is always promising to buy milk, but came home with crisps.",
      "My flatmate has promised to buy milk, but comes home with crisps.",
    ],
    correctIndex: 0,
    explanation:
      "Present Simple подходит для повторяющейся привычки. Здесь это почти пятничный ритуал.",
    contrast:
      "Второй вариант смешивает текущий процесс с завершённым прошлым, а третий делает акцент на одном обещании.",
    marker: "every Friday · always",
    hint: "Ищи привычку, которая регулярно повторяется.",
  },
  {
    id: "ps-standup",
    title: "The Daily Rhythm",
    tense: "present-simple",
    topic: "work",
    humorous: false,
    situation:
      "У вашей команды короткая встреча каждое утро, и обычно ты рассказываешь о планах на день.",
    prompt: "Which sentence sounds natural?",
    options: [
      "We have a short team meeting every morning.",
      "We are having a short team meeting every morning now.",
      "We have had a short team meeting yesterday morning.",
    ],
    correctIndex: 0,
    explanation:
      "Present Simple описывает расписание и регулярные действия.",
    contrast:
      "Present Continuous звучал бы как временная ситуация, а yesterday требует Past Simple.",
    marker: "every morning · usually",
    hint: "Подумай о расписании, а не о моменте прямо сейчас.",
  },
  {
    id: "ps-train",
    title: "The Reliable Route",
    tense: "present-simple",
    topic: "travel",
    humorous: false,
    situation:
      "Ты объясняешь другу расписание поезда: он отправляется в 7:15 завтра утром.",
    prompt: "Which option expresses a fixed timetable?",
    options: [
      "The train leaves at 7:15 tomorrow morning.",
      "The train will leaving at 7:15 tomorrow morning.",
      "The train has left at 7:15 tomorrow morning.",
    ],
    correctIndex: 0,
    explanation:
      "Present Simple используется для официальных расписаний, даже если речь о будущем.",
    contrast:
      "Will leaving грамматически неверно, а Present Perfect не сочетается с будущим временем tomorrow.",
    marker: "timetable · at 7:15",
    hint: "Расписание транспорта часто живёт в Present Simple.",
  },
  {
    id: "pc-cat",
    title: "The Keyboard Guardian",
    tense: "present-continuous",
    topic: "work",
    humorous: true,
    situation:
      "Ты прямо сейчас пытаешься закончить отчёт, но кот решил, что клавиатура — его новое кресло.",
    prompt: "What is happening at this exact moment?",
    options: [
      "I'm trying to finish the report, but my cat is sitting on the keyboard.",
      "I try to finish the report, but my cat sits on the keyboard right now.",
      "I've tried to finish the report, but my cat sat on the keyboard.",
    ],
    correctIndex: 0,
    explanation:
      "Present Continuous показывает два действия, которые происходят прямо сейчас.",
    contrast:
      "Present Simple звучит как привычка, а третий вариант переносит действия в уже завершённый опыт.",
    marker: "right now · at the moment",
    hint: "Оба действия разворачиваются у тебя перед глазами.",
  },
  {
    id: "pc-temporary",
    title: "The Temporary Desk",
    tense: "present-continuous",
    topic: "work",
    humorous: false,
    situation:
      "В этом месяце ты временно работаешь из дома, пока в офисе идёт ремонт.",
    prompt: "Which sentence highlights a temporary situation?",
    options: [
      "I'm working from home this month while the office is being renovated.",
      "I work from home this month while the office renovates.",
      "I have worked from home this month while the office was renovated.",
    ],
    correctIndex: 0,
    explanation:
      "Present Continuous подходит для временной ситуации вокруг настоящего момента.",
    contrast:
      "Present Simple скорее описал бы постоянный режим, а Present Perfect здесь не передаёт временный процесс так естественно.",
    marker: "this month · temporarily",
    hint: "Ситуация актуальна сейчас, но не навсегда.",
  },
  {
    id: "pc-change",
    title: "The Changing City",
    tense: "present-continuous",
    topic: "everyday",
    humorous: false,
    situation:
      "Ты замечаешь постепенное изменение: район становится всё оживлённее.",
    prompt: "Which option describes an ongoing change?",
    options: [
      "The neighbourhood is becoming busier every year.",
      "The neighbourhood becomes busier right now every year.",
      "The neighbourhood has become busier next year.",
    ],
    correctIndex: 0,
    explanation:
      "Present Continuous используют для процессов и изменений, которые развиваются постепенно.",
    contrast:
      "Второй вариант неестественно соединяет right now и every year, а next year не работает с Present Perfect.",
    marker: "is becoming · gradually",
    hint: "Здесь важен процесс изменения, а не постоянный факт.",
  },
  {
    id: "pp-keys",
    title: "The Vanishing Keys",
    tense: "present-perfect",
    topic: "everyday",
    humorous: true,
    situation:
      "Ты потерял ключи и до сих пор не можешь войти домой. Ключи, кажется, начали новую жизнь без тебя.",
    prompt: "Which sentence connects the past event to the present result?",
    options: [
      "I've lost my keys, so I can't get into the flat.",
      "I lost my keys, so I couldn't get into the flat now.",
      "I'm losing my keys, so I haven't got into the flat yesterday.",
    ],
    correctIndex: 0,
    explanation:
      "Present Perfect связывает прошлое событие с результатом сейчас: ключей всё ещё нет.",
    contrast:
      "Past Simple завершил бы историю в прошлом, а третий вариант смешивает несовместимые формы и yesterday.",
    marker: "result now · still relevant",
    hint: "Событие случилось раньше, но его последствие ощущается сейчас.",
  },
  {
    id: "pp-just-finish",
    title: "The Fresh Result",
    tense: "present-perfect",
    topic: "work",
    humorous: false,
    situation:
      "Ты только что закончил презентацию и можешь наконец отправить её команде.",
    prompt: "Which sentence focuses on the fresh result?",
    options: [
      "I've just finished the presentation, so I can send it now.",
      "I just finish the presentation, so I could send it now.",
      "I was just finishing the presentation, so I send it now.",
    ],
    correctIndex: 0,
    explanation:
      "Present Perfect с just подчёркивает совсем недавнее завершение и результат сейчас.",
    contrast:
      "Второй вариант использует неверную форму, а Past Continuous говорит о процессе, не о готовом результате.",
    marker: "just · already · yet",
    hint: "Работа уже готова, и это важно именно сейчас.",
  },
  {
    id: "pp-experience",
    title: "The Open Passport",
    tense: "present-perfect",
    topic: "travel",
    humorous: false,
    situation:
      "В разговоре о путешествиях ты говоришь, что трижды был в Португалии, не называя конкретные даты.",
    prompt: "Which option describes life experience?",
    options: [
      "I've been to Portugal three times.",
      "I was in Portugal three times in my life so far.",
      "I'm being to Portugal three times.",
    ],
    correctIndex: 0,
    explanation:
      "Present Perfect подходит для жизненного опыта без конкретного завершённого времени.",
    contrast:
      "Past Simple обычно требует законченного периода, а am being здесь грамматически невозможно.",
    marker: "ever · never · three times",
    hint: "Точная дата не важна; важен накопленный опыт.",
  },
  {
    id: "ppc-waiting",
    title: "The Patient Table",
    tense: "present-perfect-continuous",
    topic: "people",
    humorous: true,
    situation:
      "Ты уже сорок минут ждёшь друга в кафе. Даже официант начал смотреть на дверь вместе с тобой.",
    prompt: "Which sentence shows an action continuing until now?",
    options: [
      "I've been waiting for you for forty minutes.",
      "I've waited for you forty minutes yesterday.",
      "I'm waiting for you since forty minutes.",
    ],
    correctIndex: 0,
    explanation:
      "Present Perfect Continuous подчёркивает длительность действия, начавшегося раньше и продолжающегося сейчас.",
    contrast:
      "Yesterday требует Past Simple, а after since нужен момент начала, не длительность.",
    marker: "for forty minutes · since noon",
    hint: "Ты начал ждать раньше и всё ещё ждёшь.",
  },
  {
    id: "ppc-learning",
    title: "The Ongoing Story",
    tense: "present-perfect-continuous",
    topic: "work",
    humorous: false,
    situation:
      "Ты изучаешь английский уже два года и продолжаешь заниматься сейчас.",
    prompt: "Which option keeps the learning process alive?",
    options: [
      "I've been studying English for two years.",
      "I study English since two years.",
      "I was studying English for two years and I still do.",
    ],
    correctIndex: 0,
    explanation:
      "Present Perfect Continuous показывает продолжающийся процесс и его длительность.",
    contrast:
      "Present Simple не используется с since/for таким образом, а Past Continuous оставляет процесс в прошлом.",
    marker: "for two years · since 2024",
    hint: "Процесс начался в прошлом и всё ещё идёт.",
  },
  {
    id: "ppc-rain",
    title: "The Wet Evidence",
    tense: "present-perfect-continuous",
    topic: "everyday",
    humorous: false,
    situation:
      "Дождь шёл какое-то время, и теперь улицы мокрые, хотя, возможно, он только что закончился.",
    prompt: "Which sentence explains the visible evidence?",
    options: [
      "It's been raining, so the streets are wet.",
      "It has rained yesterday, so the streets were wet now.",
      "It rains for three hours, so the streets have been wet.",
    ],
    correctIndex: 0,
    explanation:
      "Present Perfect Continuous часто объясняет видимый результат недавнего процесса.",
    contrast:
      "Yesterday не сочетается с Present Perfect, а Present Simple не передаёт недавнюю длительность.",
    marker: "visible evidence · recently",
    hint: "На улице виден результат процесса, который шёл до настоящего момента.",
  },
  {
    id: "past-coffee",
    title: "The Expensive Coffee",
    tense: "past-simple",
    topic: "travel",
    humorous: true,
    situation:
      "Вчера ты купил кофе перед поездом, отвлёкся на красивую пенку и в итоге опоздал.",
    prompt: "Which sentence tells a finished past story?",
    options: [
      "I bought a coffee and missed my train yesterday.",
      "I've bought a coffee and miss my train yesterday.",
      "I was buying a coffee and have missed my train yesterday.",
    ],
    correctIndex: 0,
    explanation:
      "Past Simple рассказывает о последовательности завершённых событий в конкретное время в прошлом.",
    contrast:
      "Present Perfect не дружит с yesterday, а третий вариант без причины смешивает две временные линии.",
    marker: "yesterday · last week · in 2023",
    hint: "Вся история закончилась вчера.",
  },
  {
    id: "past-message",
    title: "The Sent Message",
    tense: "past-simple",
    topic: "digital",
    humorous: false,
    situation:
      "Ты написал коллеге вчера вечером и получил ответ через час.",
    prompt: "Which option gives a clear completed sequence?",
    options: [
      "I messaged my colleague last night, and she replied an hour later.",
      "I have messaged my colleague last night, and she has replied later.",
      "I message my colleague last night, and she replies an hour later.",
    ],
    correctIndex: 0,
    explanation:
      "Past Simple подходит для двух завершённых действий в определённый момент прошлого.",
    contrast:
      "Last night исключает Present Perfect, а Present Simple не подходит для единичной вчерашней истории.",
    marker: "last night · an hour later",
    hint: "Есть конкретный завершённый период: прошлый вечер.",
  },
  {
    id: "past-meet",
    title: "The First Hello",
    tense: "past-simple",
    topic: "people",
    humorous: false,
    situation:
      "Ты рассказываешь, где впервые встретил лучшую подругу: это произошло в университете.",
    prompt: "Which sentence locates the event in a finished past period?",
    options: [
      "I met my best friend when we were at university.",
      "I've met my best friend when we were at university.",
      "I was meeting my best friend when we have been at university.",
    ],
    correctIndex: 0,
    explanation:
      "Past Simple нужен для завершённого события в закончившемся периоде жизни.",
    contrast:
      "When we were at university задаёт конкретное прошлое, поэтому Present Perfect не подходит.",
    marker: "when · at university",
    hint: "Период университета уже закончился.",
  },
  {
    id: "pastc-filter",
    title: "The Accidental Cat",
    tense: "past-continuous",
    topic: "digital",
    humorous: true,
    situation:
      "Ты проводил серьёзную онлайн-презентацию, когда случайно включился фильтр с кошачьими ушами.",
    prompt: "Which sentence sets the scene for the interruption?",
    options: [
      "I was giving a presentation when the cat filter suddenly appeared.",
      "I gave a presentation when the cat filter was suddenly appearing.",
      "I've been giving a presentation when the cat filter appeared.",
    ],
    correctIndex: 0,
    explanation:
      "Past Continuous задаёт длительный фон, а Past Simple — короткое событие, которое его прервало.",
    contrast:
      "Во втором варианте акценты перепутаны, а Present Perfect Continuous не работает с конкретным прошлым when.",
    marker: "was doing · when it happened",
    hint: "Одно действие уже шло, когда внезапно случилось другое.",
  },
  {
    id: "pastc-cooking",
    title: "The Interrupted Dinner",
    tense: "past-continuous",
    topic: "everyday",
    humorous: false,
    situation:
      "Ты готовил ужин, когда сработала пожарная сигнализация.",
    prompt: "Which option describes the background action?",
    options: [
      "I was cooking dinner when the fire alarm went off.",
      "I cooked dinner when the fire alarm was going off.",
      "I have cooked dinner when the fire alarm went off.",
    ],
    correctIndex: 0,
    explanation:
      "Готовка была процессом, внутри которого произошло короткое событие — сигнализация.",
    contrast:
      "Past Simple для готовки убирает ощущение процесса, а Present Perfect здесь нарушает прошлую временную линию.",
    marker: "while · when",
    hint: "Найди более длинное действие-фон.",
  },
  {
    id: "pastc-parallel",
    title: "The Parallel Evening",
    tense: "past-continuous",
    topic: "people",
    humorous: false,
    situation:
      "Вчера в восемь ты готовил, а твоя сестра разговаривала по телефону — оба действия шли одновременно.",
    prompt: "Which sentence shows two parallel actions?",
    options: [
      "While I was cooking, my sister was talking on the phone.",
      "While I cooked, my sister has talked on the phone.",
      "While I have been cooking, my sister talked on the phone.",
    ],
    correctIndex: 0,
    explanation:
      "Два Past Continuous показывают процессы, которые одновременно шли в прошлом.",
    contrast:
      "Остальные варианты смешивают завершённые и настоящие формы без смысловой причины.",
    marker: "while · at 8 p.m. yesterday",
    hint: "Оба действия были в процессе в один и тот же момент.",
  },
  {
    id: "ppast-cinema",
    title: "The Missing Beginning",
    tense: "past-perfect",
    topic: "people",
    humorous: false,
    situation:
      "Когда вы добрались до кинотеатра, фильм уже начался.",
    prompt: "Which sentence makes the earlier event clear?",
    options: [
      "By the time we reached the cinema, the film had already started.",
      "By the time we had reached the cinema, the film already started.",
      "By the time we reach the cinema, the film has already started yesterday.",
    ],
    correctIndex: 0,
    explanation:
      "Past Perfect отмечает событие, которое произошло раньше другого события в прошлом.",
    contrast:
      "Второй вариант меняет события местами, а третий смешивает настоящее с yesterday.",
    marker: "by the time · already",
    hint: "Сначала начался фильм, потом вы пришли.",
  },
  {
    id: "ppast-cake",
    title: "The Cake Alibi",
    tense: "past-perfect",
    topic: "everyday",
    humorous: true,
    situation:
      "К приходу гостей собака уже съела половину торта и выглядела совершенно невиновной.",
    prompt: "Which option reveals what happened first?",
    options: [
      "The dog had eaten half the cake before the guests arrived.",
      "The dog ate half the cake before the guests had arrived.",
      "The dog has eaten half the cake before the guests arrived yesterday.",
    ],
    correctIndex: 0,
    explanation:
      "Past Perfect подчёркивает, что исчезновение торта случилось до прихода гостей.",
    contrast:
      "Второй вариант грамматически возможен в некоторых контекстах, но неверно выделяет более позднее событие; Present Perfect с yesterday не подходит.",
    marker: "before · by the time",
    hint: "Расставь события: торт исчез первым.",
  },
  {
    id: "ppast-email",
    title: "The Earlier Decision",
    tense: "past-perfect",
    topic: "work",
    humorous: false,
    situation:
      "Когда ты открыл почту утром, менеджер уже отправил окончательное решение.",
    prompt: "Which sentence separates the two past moments?",
    options: [
      "When I checked my inbox, the manager had already sent the final decision.",
      "When I had checked my inbox, the manager already sent the final decision.",
      "When I check my inbox, the manager had sent the final decision.",
    ],
    correctIndex: 0,
    explanation:
      "Отправка произошла до того, как ты проверил почту, поэтому более раннее действие стоит в Past Perfect.",
    contrast:
      "Во втором варианте Past Perfect ошибочно относится к более поздней проверке, а третий смешивает настоящее и прошлое.",
    marker: "had already · when",
    hint: "Какое из двух прошлых действий случилось раньше?",
  },
  {
    id: "ppc-past-laptop",
    title: "The Unplugged Hero",
    tense: "past-perfect-continuous",
    topic: "work",
    humorous: true,
    situation:
      "Ты работал два часа, прежде чем понял, что ноутбук не подключён к розетке и держится на одном оптимизме.",
    prompt: "Which sentence highlights the duration before a past discovery?",
    options: [
      "I'd been working for two hours before I realised the laptop wasn't plugged in.",
      "I was working for two hours before I had realised the laptop isn't plugged in.",
      "I've been working for two hours before I realised the laptop wasn't plugged in.",
    ],
    correctIndex: 0,
    explanation:
      "Past Perfect Continuous показывает длительный процесс, шедший до другого момента в прошлом.",
    contrast:
      "Второй вариант неверно выделяет более позднее осознание, а Present Perfect связывал бы процесс с настоящим.",
    marker: "for two hours before · had been",
    hint: "Процесс длился некоторое время до прошлого открытия.",
  },
  {
    id: "ppc-past-bus",
    title: "The Long Platform",
    tense: "past-perfect-continuous",
    topic: "travel",
    humorous: false,
    situation:
      "До приезда автобуса люди ждали на остановке больше часа.",
    prompt: "Which option shows the long activity before the bus arrived?",
    options: [
      "People had been waiting for over an hour when the bus finally arrived.",
      "People were waiting for over an hour when the bus had finally arrived.",
      "People have been waiting for over an hour when the bus finally arrived.",
    ],
    correctIndex: 0,
    explanation:
      "Past Perfect Continuous подчёркивает длительность ожидания до конкретного события в прошлом.",
    contrast:
      "Во втором варианте Past Perfect ошибочно поставлен на более позднее событие, а третий переносит ожидание к настоящему.",
    marker: "for an hour when · finally",
    hint: "Ожидание началось задолго до приезда автобуса.",
  },
  {
    id: "ppc-past-training",
    title: "The Quiet Preparation",
    tense: "past-perfect-continuous",
    topic: "plans",
    humorous: false,
    situation:
      "До своего первого полумарафона она тренировалась несколько месяцев.",
    prompt: "Which sentence focuses on the preparation process?",
    options: [
      "She had been training for months before she ran her first half-marathon.",
      "She was training for months before she had run her first half-marathon.",
      "She has trained for months before she ran her first half-marathon.",
    ],
    correctIndex: 0,
    explanation:
      "Past Perfect Continuous показывает длительную подготовку до завершённого события в прошлом.",
    contrast:
      "Остальные варианты неверно выделяют более поздний забег или связывают прошлую историю с настоящим.",
    marker: "for months before",
    hint: "Важна длительность подготовки до результата.",
  },
  {
    id: "future-help",
    title: "The Instant Promise",
    tense: "future-simple",
    topic: "people",
    humorous: false,
    situation:
      "Друг говорит, что не успевает закончить проект. Ты прямо в этот момент решаешь помочь.",
    prompt: "Which sentence expresses a spontaneous decision?",
    options: [
      "Don't worry, I'll help you finish it.",
      "Don't worry, I'm helping you finish it yesterday.",
      "Don't worry, I'll be helped you finish it.",
    ],
    correctIndex: 0,
    explanation:
      "Future Simple часто используется для решения, принятого прямо в момент речи.",
    contrast:
      "Второй вариант конфликтует с yesterday, а третий содержит неверную пассивную форму.",
    marker: "I’ll · spontaneous decision",
    hint: "Решение появилось только что, заранее его не планировали.",
  },
  {
    id: "future-predict",
    title: "The Gentle Forecast",
    tense: "future-simple",
    topic: "plans",
    humorous: false,
    situation:
      "Ты высказываешь личное предположение: думаешь, что встреча пройдёт хорошо.",
    prompt: "Which option gives a simple opinion about the future?",
    options: [
      "I think the meeting will go well.",
      "I think the meeting is going well yesterday.",
      "I think the meeting will going well.",
    ],
    correctIndex: 0,
    explanation:
      "Future Simple с I think подходит для предположения или мнения о будущем.",
    contrast:
      "Yesterday переносит ситуацию в прошлое, а после will используется базовая форма go, не going.",
    marker: "I think · probably · perhaps",
    hint: "Это мнение, а не договорённый план.",
  },
  {
    id: "future-phone",
    title: "The Phone Prophecy",
    tense: "future-simple",
    topic: "digital",
    humorous: true,
    situation:
      "Телефон показывает 2% заряда. Ты делаешь очень смелый прогноз о ближайших пяти минутах.",
    prompt: "Which sentence predicts the obvious future?",
    options: [
      "My phone will die in about five minutes.",
      "My phone dies in about five minutes yesterday.",
      "My phone has died in about five minutes.",
    ],
    correctIndex: 0,
    explanation:
      "Future Simple выражает прогноз о будущем, основанный на твоём мнении.",
    contrast:
      "Yesterday несовместимо с прогнозом, а Present Perfect описал бы уже случившийся результат.",
    marker: "will probably · I think",
    hint: "Это прогноз о том, что произойдёт через несколько минут.",
  },
  {
    id: "fc-flight",
    title: "The View From Tomorrow",
    tense: "future-continuous",
    topic: "travel",
    humorous: false,
    situation:
      "Завтра в это время ты будешь лететь над Альпами.",
    prompt: "Which sentence places you inside a future process?",
    options: [
      "This time tomorrow, I'll be flying over the Alps.",
      "This time tomorrow, I'll fly over the Alps yesterday.",
      "This time tomorrow, I've been flying over the Alps.",
    ],
    correctIndex: 0,
    explanation:
      "Future Continuous описывает действие, которое будет в процессе в конкретный момент будущего.",
    contrast:
      "Второй вариант содержит конфликт времён, а Present Perfect Continuous не переносит нас в завтрашний процесс.",
    marker: "this time tomorrow · at 8 p.m.",
    hint: "Представь один кадр из завтрашнего дня.",
  },
  {
    id: "fc-meeting",
    title: "The Busy Hour",
    tense: "future-continuous",
    topic: "work",
    humorous: false,
    situation:
      "Коллега хочет позвонить в три, но в это время ты будешь встречаться с клиентом.",
    prompt: "Which option describes your activity at 3 p.m.?",
    options: [
      "I'll be meeting a client at three, so can we talk later?",
      "I'll meet a client at three while you called.",
      "I've been meeting a client at three, so we talk later.",
    ],
    correctIndex: 0,
    explanation:
      "Future Continuous показывает запланированный процесс в определённый будущий момент.",
    contrast:
      "Остальные варианты смешивают будущий момент с прошлыми или настоящими формами.",
    marker: "at three tomorrow · will be doing",
    hint: "В три часа действие будет уже происходить.",
  },
  {
    id: "fc-sofa",
    title: "The Weekend Vision",
    tense: "future-continuous",
    topic: "plans",
    humorous: true,
    situation:
      "В субботу вечером ты планируешь смотреть сериал. Диван уже мысленно забронировал тебя.",
    prompt: "Which sentence shows the future activity in progress?",
    options: [
      "On Saturday evening, I'll be watching the new series.",
      "On Saturday evening, I watched the new series tomorrow.",
      "On Saturday evening, I'll have watched the series right now.",
    ],
    correctIndex: 0,
    explanation:
      "Future Continuous рисует действие, которое будет разворачиваться в выбранный момент будущего.",
    contrast:
      "Past Simple и right now не подходят к субботнему будущему контексту.",
    marker: "on Saturday evening",
    hint: "Не результат, а сам процесс субботнего вечера.",
  },
  {
    id: "fp-deadline",
    title: "The Finished Deadline",
    tense: "future-perfect",
    topic: "work",
    humorous: false,
    situation:
      "Ты уверен, что закончишь отчёт к пятнице.",
    prompt: "Which sentence looks back from the Friday deadline?",
    options: [
      "I'll have finished the report by Friday.",
      "I'll finish the report since Friday.",
      "I'll be finishing the report yesterday by Friday.",
    ],
    correctIndex: 0,
    explanation:
      "Future Perfect показывает, что действие завершится до определённого момента в будущем.",
    contrast:
      "Since не обозначает дедлайн, а yesterday разрушает будущую временную линию.",
    marker: "by Friday · by then",
    hint: "К пятнице результат уже будет готов.",
  },
  {
    id: "fp-arrival",
    title: "The Ready Room",
    tense: "future-perfect",
    topic: "everyday",
    humorous: false,
    situation:
      "К приходу гостей ты уже закончишь уборку квартиры.",
    prompt: "Which option shows completion before the guests arrive?",
    options: [
      "I'll have cleaned the flat by the time the guests arrive.",
      "I'll have cleaned the flat by the time the guests will arrive.",
      "I cleaned the flat by the time the guests arrive tomorrow.",
    ],
    correctIndex: 0,
    explanation:
      "Future Perfect описывает готовый результат до будущего момента; после by the time ставим Present Simple.",
    contrast:
      "Во временном придаточном после by the time обычно не нужен will, а Past Simple не подходит к tomorrow.",
    marker: "by the time · will have done",
    hint: "Сначала уборка завершится, потом придут гости.",
  },
  {
    id: "fp-updates",
    title: "The Updated Update",
    tense: "future-perfect",
    topic: "digital",
    humorous: true,
    situation:
      "К моменту, когда ты дочитаешь описание обновления, приложение, вероятно, выпустит ещё одно обновление.",
    prompt: "Which sentence captures this digital loop?",
    options: [
      "By the time you finish reading, the app will have released another update.",
      "By the time you will finish reading, the app releases another update yesterday.",
      "By the time you finished reading, the app will release another update now.",
    ],
    correctIndex: 0,
    explanation:
      "Future Perfect показывает результат, который появится раньше другого будущего момента.",
    contrast:
      "После by the time нужен Present Simple, а yesterday и now не подходят к этой будущей последовательности.",
    marker: "by the time · another",
    hint: "Одно будущее действие успеет завершиться раньше другого.",
  },
  {
    id: "fpc-work",
    title: "The Long Milestone",
    tense: "future-perfect-continuous",
    topic: "work",
    humorous: false,
    situation:
      "В июне исполнится пять лет с тех пор, как ты начал работать в компании.",
    prompt: "Which sentence measures the process up to a future point?",
    options: [
      "By June, I'll have been working here for five years.",
      "By June, I'll be working here since five years.",
      "By June, I've been working here for five years tomorrow.",
    ],
    correctIndex: 0,
    explanation:
      "Future Perfect Continuous подчёркивает длительность процесса до определённой точки в будущем.",
    contrast:
      "Since требует начальную дату, а Present Perfect не может опираться на будущий дедлайн by June.",
    marker: "by June · for five years",
    hint: "В будущем мы измеряем, сколько времени уже будет длиться процесс.",
  },
  {
    id: "fpc-wait",
    title: "The Heroic Wait",
    tense: "future-perfect-continuous",
    topic: "people",
    humorous: true,
    situation:
      "Если друг опоздает ещё на десять минут, к восьми ты будешь ждать его уже целых два часа и заслужишь памятник терпению.",
    prompt: "Which option measures the waiting by 8 p.m.?",
    options: [
      "By eight, I'll have been waiting for two hours.",
      "By eight, I'll wait since two hours.",
      "By eight, I have waited for two hours yesterday.",
    ],
    correctIndex: 0,
    explanation:
      "Future Perfect Continuous показывает длительность ожидания, накопившуюся к будущему моменту.",
    contrast:
      "Since нельзя использовать с длительностью two hours, а yesterday противоречит будущему by eight.",
    marker: "by eight · for two hours",
    hint: "В восемь процесс ещё может идти, но его длительность уже составит два часа.",
  },
  {
    id: "fpc-study",
    title: "The Growing Practice",
    tense: "future-perfect-continuous",
    topic: "plans",
    humorous: false,
    situation:
      "К следующему месяцу ты будешь заниматься английским без перерыва уже полгода.",
    prompt: "Which sentence looks at the length of your future progress?",
    options: [
      "By next month, I'll have been studying English for six months.",
      "By next month, I'll study English since six months.",
      "By next month, I was studying English for six months.",
    ],
    correctIndex: 0,
    explanation:
      "Future Perfect Continuous измеряет длительность продолжающегося действия к будущей точке.",
    contrast:
      "Since требует момента начала, а Past Continuous переносит процесс в прошлое.",
    marker: "by next month · for six months",
    hint: "Смотри из будущего на длину продолжающегося пути.",
  },
];

const DEFAULT_TENSES: TenseId[] = [
  "present-simple",
  "present-continuous",
  "present-perfect",
  "past-simple",
];

const DEFAULT_TOPICS = TOPICS.map((topic) => topic.id);

const DRAW_INTROS = [
  "Не вспоминай правило заранее. Сначала почувствуй, как события расположены во времени.",
  "Представь ситуацию как короткую сцену и выбери фразу, которая звучит естественно.",
  "Сначала улови момент во времени — форма глагола придёт следом.",
  "Не спеши искать формулу. Посмотри, что уже случилось, что происходит и что будет дальше.",
  "Прислушайся к контексту: он подсказывает время лучше отдельного правила.",
  "Один спокойный вдох, один сюжет, один выбор. Открой карту, когда будешь готов.",
];

const PEOPLE = [
  { en: "Alex", ru: "Алекс" },
  { en: "Maya", ru: "Майи" },
  { en: "Daniel", ru: "Дэниела" },
  { en: "Nora", ru: "Норы" },
  { en: "Sam", ru: "Сэма" },
  { en: "Lena", ru: "Лены" },
  { en: "Chris", ru: "Криса" },
  { en: "Eva", ru: "Евы" },
  { en: "Leo", ru: "Лео" },
  { en: "Mia", ru: "Мии" },
];

const DAYS = [
  { en: "Monday", ru: "каждый понедельник" },
  { en: "Tuesday", ru: "каждый вторник" },
  { en: "Wednesday", ru: "каждую среду" },
  { en: "Thursday", ru: "каждый четверг" },
  { en: "Friday", ru: "каждую пятницу" },
  { en: "Saturday", ru: "каждую субботу" },
  { en: "Sunday", ru: "каждое воскресенье" },
];

const DURATIONS = [
  { en: "forty minutes", ru: "сорок минут" },
  { en: "two hours", ru: "два часа" },
  { en: "three days", ru: "три дня" },
  { en: "a week", ru: "неделю" },
  { en: "two weeks", ru: "две недели" },
  { en: "a month", ru: "месяц" },
  { en: "six months", ru: "полгода" },
  { en: "a year", ru: "год" },
];

const TIMES = ["8 a.m.", "10 a.m.", "noon", "2 p.m.", "4 p.m.", "7 p.m."];

const DEADLINES = [
  "tomorrow morning",
  "Friday",
  "the end of the week",
  "next Monday",
  "the end of the month",
  "the next team meeting",
];

const SCENE_ACTIONS: Record<TopicId, SceneAction[]> = {
  everyday: [
    {
      base: "organise the kitchen shelves",
      third: "organises the kitchen shelves",
      ing: "organising the kitchen shelves",
      past: "organised the kitchen shelves",
      participle: "organised the kitchen shelves",
      ruInfinitive: "разобрать полки на кухне",
    },
    {
      base: "sort the old photos",
      third: "sorts the old photos",
      ing: "sorting the old photos",
      past: "sorted the old photos",
      participle: "sorted the old photos",
      ruInfinitive: "разобрать старые фотографии",
    },
    {
      base: "learn a new recipe",
      third: "learns a new recipe",
      ing: "learning a new recipe",
      past: "learned a new recipe",
      participle: "learned a new recipe",
      ruInfinitive: "освоить новый рецепт",
    },
    {
      base: "redecorate the living room",
      third: "redecorates the living room",
      ing: "redecorating the living room",
      past: "redecorated the living room",
      participle: "redecorated the living room",
      ruInfinitive: "обновить гостиную",
    },
  ],
  work: [
    {
      base: "review the project notes",
      third: "reviews the project notes",
      ing: "reviewing the project notes",
      past: "reviewed the project notes",
      participle: "reviewed the project notes",
      ruInfinitive: "проверить заметки по проекту",
    },
    {
      base: "prepare the client presentation",
      third: "prepares the client presentation",
      ing: "preparing the client presentation",
      past: "prepared the client presentation",
      participle: "prepared the client presentation",
      ruInfinitive: "подготовить презентацию для клиента",
    },
    {
      base: "update the weekly report",
      third: "updates the weekly report",
      ing: "updating the weekly report",
      past: "updated the weekly report",
      participle: "updated the weekly report",
      ruInfinitive: "обновить еженедельный отчёт",
    },
    {
      base: "answer the team's messages",
      third: "answers the team's messages",
      ing: "answering the team's messages",
      past: "answered the team's messages",
      participle: "answered the team's messages",
      ruInfinitive: "ответить на сообщения команды",
    },
  ],
  people: [
    {
      base: "plan a birthday dinner",
      third: "plans a birthday dinner",
      ing: "planning a birthday dinner",
      past: "planned a birthday dinner",
      participle: "planned a birthday dinner",
      ruInfinitive: "спланировать праздничный ужин",
    },
    {
      base: "help a neighbour move",
      third: "helps a neighbour move",
      ing: "helping a neighbour move",
      past: "helped a neighbour move",
      participle: "helped a neighbour move",
      ruInfinitive: "помочь соседу с переездом",
    },
    {
      base: "write a thoughtful reply",
      third: "writes a thoughtful reply",
      ing: "writing a thoughtful reply",
      past: "wrote a thoughtful reply",
      participle: "written a thoughtful reply",
      ruInfinitive: "написать вдумчивый ответ",
    },
    {
      base: "organise a friends' reunion",
      third: "organises a friends' reunion",
      ing: "organising a friends' reunion",
      past: "organised a friends' reunion",
      participle: "organised a friends' reunion",
      ruInfinitive: "организовать встречу друзей",
    },
  ],
  travel: [
    {
      base: "plan a train journey",
      third: "plans a train journey",
      ing: "planning a train journey",
      past: "planned a train journey",
      participle: "planned a train journey",
      ruInfinitive: "спланировать поездку на поезде",
    },
    {
      base: "pack a small suitcase",
      third: "packs a small suitcase",
      ing: "packing a small suitcase",
      past: "packed a small suitcase",
      participle: "packed a small suitcase",
      ruInfinitive: "собрать небольшой чемодан",
    },
    {
      base: "compare the hotel options",
      third: "compares the hotel options",
      ing: "comparing the hotel options",
      past: "compared the hotel options",
      participle: "compared the hotel options",
      ruInfinitive: "сравнить варианты отелей",
    },
    {
      base: "choose a walking route",
      third: "chooses a walking route",
      ing: "choosing a walking route",
      past: "chose a walking route",
      participle: "chosen a walking route",
      ruInfinitive: "выбрать маршрут для прогулки",
    },
  ],
  digital: [
    {
      base: "back up the photo library",
      third: "backs up the photo library",
      ing: "backing up the photo library",
      past: "backed up the photo library",
      participle: "backed up the photo library",
      ruInfinitive: "сделать резервную копию фотографий",
    },
    {
      base: "update the online portfolio",
      third: "updates the online portfolio",
      ing: "updating the online portfolio",
      past: "updated the online portfolio",
      participle: "updated the online portfolio",
      ruInfinitive: "обновить онлайн-портфолио",
    },
    {
      base: "organise the browser tabs",
      third: "organises the browser tabs",
      ing: "organising the browser tabs",
      past: "organised the browser tabs",
      participle: "organised the browser tabs",
      ruInfinitive: "разобрать вкладки в браузере",
    },
    {
      base: "edit a short video",
      third: "edits a short video",
      ing: "editing a short video",
      past: "edited a short video",
      participle: "edited a short video",
      ruInfinitive: "смонтировать короткое видео",
    },
  ],
  plans: [
    {
      base: "practise a difficult conversation",
      third: "practises a difficult conversation",
      ing: "practising a difficult conversation",
      past: "practised a difficult conversation",
      participle: "practised a difficult conversation",
      ruInfinitive: "отрепетировать сложный разговор",
    },
    {
      base: "research a new course",
      third: "researches a new course",
      ing: "researching a new course",
      past: "researched a new course",
      participle: "researched a new course",
      ruInfinitive: "изучить новый учебный курс",
    },
    {
      base: "write down next month's goals",
      third: "writes down next month's goals",
      ing: "writing down next month's goals",
      past: "wrote down next month's goals",
      participle: "written down next month's goals",
      ruInfinitive: "записать цели на следующий месяц",
    },
    {
      base: "train for a morning run",
      third: "trains for a morning run",
      ing: "training for a morning run",
      past: "trained for a morning run",
      participle: "trained for a morning run",
      ruInfinitive: "подготовиться к утренней пробежке",
    },
  ],
};

const GENERATED_TITLES: Record<TenseId, string[]> = {
  "present-simple": ["The Familiar Pattern", "The Daily Compass", "The Regular Beat"],
  "present-continuous": ["The Living Moment", "The Scene in Motion", "The Open Window"],
  "present-perfect": ["The Present Echo", "The Fresh Result", "The Mark Left Behind"],
  "present-perfect-continuous": ["The Unbroken Thread", "The Growing Story", "The Lasting Effort"],
  "past-simple": ["The Finished Chapter", "The Clear Memory", "The Day Before"],
  "past-continuous": ["The Interrupted Scene", "The Moving Background", "The Moment Within"],
  "past-perfect": ["The Earlier Footstep", "The Hidden Beginning", "The First Event"],
  "past-perfect-continuous": ["The Long Preparation", "The Earlier Process", "The Road Before"],
  "future-simple": ["The New Decision", "The Quiet Prediction", "The Next Step"],
  "future-continuous": ["The Future Scene", "The Hour Ahead", "The Coming Motion"],
  "future-perfect": ["The Finished Horizon", "The Future Result", "The Completed Promise"],
  "future-perfect-continuous": ["The Long Horizon", "The Future Milestone", "The Growing Distance"],
};

const TENSE_GUIDES: Record<
  TenseId,
  Pick<Card, "prompt" | "explanation" | "contrast" | "marker" | "hint">
> = {
  "present-simple": {
    prompt: "Which sentence describes the regular pattern?",
    explanation: "Present Simple описывает привычку или регулярно повторяющееся действие.",
    contrast: "Continuous показывает процесс, а Present Perfect связывает прошлое действие с результатом сейчас.",
    marker: "every week · usually · regularly",
    hint: "Ищи привычку или устойчивый ритм.",
  },
  "present-continuous": {
    prompt: "Which sentence belongs to this exact moment?",
    explanation: "Present Continuous показывает действие, которое происходит прямо сейчас.",
    contrast: "Present Simple превратил бы сцену в привычку, а Present Perfect — в уже полученный результат.",
    marker: "right now · at the moment",
    hint: "Представь, что действие видно прямо перед тобой.",
  },
  "present-perfect": {
    prompt: "Which sentence connects the result to now?",
    explanation: "Present Perfect связывает завершённое действие с его актуальным результатом.",
    contrast: "Конкретное законченное время требует Past Simple, а Continuous переносит акцент на процесс.",
    marker: "already · just · result now",
    hint: "Действие закончено, но результат важен сейчас.",
  },
  "present-perfect-continuous": {
    prompt: "Which sentence keeps the process going until now?",
    explanation: "Present Perfect Continuous подчёркивает длительность процесса, начавшегося раньше и продолжающегося сейчас.",
    contrast: "Since требует начальную точку, а Past Continuous оставляет действие в прошлом.",
    marker: "for · since · all morning",
    hint: "Процесс начался раньше и всё ещё продолжается.",
  },
  "past-simple": {
    prompt: "Which sentence tells a finished past event?",
    explanation: "Past Simple описывает завершённое действие в конкретный момент прошлого.",
    contrast: "Present Perfect не сочетается с законченным временем вроде yesterday, а Continuous показывает процесс.",
    marker: "yesterday · last night · ago",
    hint: "Событие полностью осталось в прошлом.",
  },
  "past-continuous": {
    prompt: "Which sentence shows the background action?",
    explanation: "Past Continuous показывает процесс, внутри которого произошло более короткое событие.",
    contrast: "Past Simple завершает действие целиком, а Present Perfect возвращает нас к настоящему.",
    marker: "was doing · when",
    hint: "Одно действие уже шло, когда случилось другое.",
  },
  "past-perfect": {
    prompt: "Which sentence makes the earlier past event clear?",
    explanation: "Past Perfect отмечает действие, которое завершилось раньше другого события в прошлом.",
    contrast: "После had нужна третья форма глагола; Present Perfect не подходит к полностью прошлой истории.",
    marker: "had already · before",
    hint: "Определи, какое прошлое действие случилось первым.",
  },
  "past-perfect-continuous": {
    prompt: "Which sentence highlights the earlier duration?",
    explanation: "Past Perfect Continuous показывает длительный процесс до другого момента в прошлом.",
    contrast: "Present Perfect связывает процесс с настоящим, а простая форма не передаёт накопленную длительность.",
    marker: "had been doing · for · before",
    hint: "Важна длительность процесса до прошлого события.",
  },
  "future-simple": {
    prompt: "Which sentence gives a simple future prediction?",
    explanation: "Future Simple подходит для прогноза, обещания или решения о будущем.",
    contrast: "После will используется базовая форма глагола, а Present Perfect не работает с tomorrow.",
    marker: "will · I think · probably",
    hint: "Это прогноз или решение, а не процесс в конкретный час.",
  },
  "future-continuous": {
    prompt: "Which sentence places the action inside a future moment?",
    explanation: "Future Continuous показывает действие в процессе в определённый момент будущего.",
    contrast: "После will be нужна форма с -ing; Future Perfect говорил бы о готовом результате.",
    marker: "at this time tomorrow · will be doing",
    hint: "Представь один кадр из будущего процесса.",
  },
  "future-perfect": {
    prompt: "Which sentence shows completion before a future point?",
    explanation: "Future Perfect показывает результат, который будет готов к определённому моменту в будущем.",
    contrast: "После will have нужна третья форма глагола, а обычный Future Simple не выделяет готовый результат.",
    marker: "by · will have done",
    hint: "К будущему дедлайну действие уже завершится.",
  },
  "future-perfect-continuous": {
    prompt: "Which sentence measures the process up to a future point?",
    explanation: "Future Perfect Continuous измеряет длительность продолжающегося процесса к будущей точке.",
    contrast: "Since не используется с длительностью, а Future Continuous не показывает, сколько времени накопилось.",
    marker: "by · for · will have been doing",
    hint: "Посмотри из будущего на длину продолжающегося процесса.",
  },
};

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

function shuffleCardOptions(card: Card, roundId: string): DeckCard {
  const indexed = card.options.map((option, index) => ({ option, index }));
  const mixed = shuffle(indexed);
  return {
    ...card,
    roundId,
    options: mixed.map((item) => item.option),
    correctIndex: mixed.findIndex((item) => item.index === card.correctIndex),
  };
}

function chooseBySerial<T>(items: T[], serial: number, divisor = 1): T {
  return items[Math.floor(serial / divisor) % items.length];
}

function createGeneratedCard(
  tense: TenseId,
  topic: TopicId,
  serial: number,
): Card {
  const person = chooseBySerial(PEOPLE, serial);
  const actions = SCENE_ACTIONS[topic];
  const action = chooseBySerial(actions, serial, PEOPLE.length);
  const day = chooseBySerial(DAYS, serial, PEOPLE.length * actions.length);
  const duration = chooseBySerial(DURATIONS, serial, actions.length);
  const time = chooseBySerial(TIMES, serial, PEOPLE.length * 2);
  const deadline = chooseBySerial(DEADLINES, serial, PEOPLE.length * actions.length);
  const guide = TENSE_GUIDES[tense];
  let situation = "";
  let options: string[] = [];

  switch (tense) {
    case "present-simple":
      situation = `У ${person.ru} есть регулярная привычка: ${action.ruInfinitive} ${day.ru}.`;
      options = [
        `${person.en} ${action.third} every ${day.en}.`,
        `${person.en} is ${action.ing} every ${day.en} yesterday.`,
        `${person.en} has ${action.participle} every ${day.en} last week.`,
      ];
      break;
    case "present-continuous":
      situation = `Прямо сейчас у ${person.ru} идёт одна задача — нужно ${action.ruInfinitive}.`;
      options = [
        `${person.en} is ${action.ing} right now.`,
        `${person.en} ${action.third} right now at the moment.`,
        `${person.en} has ${action.participle} right now yesterday.`,
      ];
      break;
    case "present-perfect":
      situation = `Задача уже выполнена: ${person.ru} удалось ${action.ruInfinitive}. Результат важен сейчас.`;
      options = [
        `${person.en} has already ${action.participle}, so the result is ready now.`,
        `${person.en} has ${action.participle} yesterday, so the result is ready now.`,
        `${person.en} has been ${action.ing} yesterday and finished now.`,
      ];
      break;
    case "present-perfect-continuous":
      situation = `${person.en} занимается одной задачей уже ${duration.ru}: нужно ${action.ruInfinitive}. Процесс всё ещё продолжается.`;
      options = [
        `${person.en} has been ${action.ing} for ${duration.en}.`,
        `${person.en} is ${action.ing} since ${duration.en}.`,
        `${person.en} has ${action.ing} for ${duration.en}.`,
      ];
      break;
    case "past-simple":
      situation = `Вчера у ${person.ru} была задача — ${action.ruInfinitive}, и она была полностью завершена.`;
      options = [
        `${person.en} ${action.past} yesterday evening.`,
        `${person.en} has ${action.participle} yesterday evening.`,
        `${person.en} is ${action.ing} yesterday evening.`,
      ];
      break;
    case "past-continuous":
      situation = `Вчера в ${time} у ${person.ru} шёл процесс: нужно было ${action.ruInfinitive}, когда пришло новое сообщение.`;
      options = [
        `${person.en} was ${action.ing} at ${time} yesterday when a message arrived.`,
        `${person.en} ${action.past} at ${time} when a message was arriving.`,
        `${person.en} has been ${action.ing} at ${time} yesterday.`,
      ];
      break;
    case "past-perfect":
      situation = `До начала встречи задача уже была готова: ${person.ru} удалось ${action.ruInfinitive}.`;
      options = [
        `${person.en} had already ${action.participle} before the meeting started.`,
        `${person.en} has already ${action.participle} before the meeting started yesterday.`,
        `${person.en} had ${action.base} before the meeting started.`,
      ];
      break;
    case "past-perfect-continuous":
      situation = `До начала встречи ${person.en} занимался задачей «${action.ruInfinitive}» уже ${duration.ru}.`;
      options = [
        `${person.en} had been ${action.ing} for ${duration.en} before the meeting started.`,
        `${person.en} was ${action.ing} for ${duration.en} before the meeting had started.`,
        `${person.en} has been ${action.ing} for ${duration.en} before the meeting started yesterday.`,
      ];
      break;
    case "future-simple":
      situation = `Ты делаешь простой прогноз: завтра ${person.en}, вероятно, решит ${action.ruInfinitive}.`;
      options = [
        `I think ${person.en} will ${action.base} tomorrow.`,
        `I think ${person.en} will ${action.ing} tomorrow.`,
        `I think ${person.en} has ${action.participle} tomorrow.`,
      ];
      break;
    case "future-continuous":
      situation = `Завтра в ${time} ${person.en} будет в процессе выполнения задачи: ${action.ruInfinitive}.`;
      options = [
        `At ${time} tomorrow, ${person.en} will be ${action.ing}.`,
        `At ${time} tomorrow, ${person.en} will ${action.ing}.`,
        `At ${time} tomorrow, ${person.en} has been ${action.ing}.`,
      ];
      break;
    case "future-perfect":
      situation = `К сроку «${deadline}» у ${person.ru} уже будет готов результат задачи: ${action.ruInfinitive}.`;
      options = [
        `By ${deadline}, ${person.en} will have ${action.participle}.`,
        `By ${deadline}, ${person.en} will has ${action.participle}.`,
        `${person.en} has ${action.participle} by ${deadline} tomorrow.`,
      ];
      break;
    case "future-perfect-continuous":
      situation = `К сроку «${deadline}» ${person.en} будет заниматься задачей «${action.ruInfinitive}» уже ${duration.ru}.`;
      options = [
        `By ${deadline}, ${person.en} will have been ${action.ing} for ${duration.en}.`,
        `By ${deadline}, ${person.en} will be ${action.ing} since ${duration.en}.`,
        `By ${deadline}, ${person.en} will have ${action.ing} for ${duration.en}.`,
      ];
      break;
  }

  return {
    id: `generated-${tense}-${serial}`,
    title: chooseBySerial(GENERATED_TITLES[tense], serial),
    tense,
    topic,
    humorous: false,
    situation,
    options,
    correctIndex: 0,
    ...guide,
  };
}

function toStoredCard(card: DeckCard): Card {
  const storedCard = { ...card };
  delete (storedCard as Partial<DeckCard>).roundId;
  return storedCard;
}

function buildIntroSequence(count: number): string[] {
  const sequence: string[] = [];
  while (sequence.length < count) {
    const batch = shuffle(DRAW_INTROS);
    if (sequence.at(-1) === batch[0] && batch.length > 1) {
      [batch[0], batch[1]] = [batch[1], batch[0]];
    }
    sequence.push(...batch);
  }
  return sequence.slice(0, count);
}

function buildDeck(
  count: number,
  tenseIds: TenseId[],
  topicIds: TopicId[],
  seenIds: string[],
  repeatQueue: Card[],
  serialState: SerialState,
  reviewHistory: ReviewHistory<Card>,
  now: number,
): { cards: DeckCard[]; nextSerialState: SerialState } {
  const tenseOrder = shuffle(tenseIds);
  const pools = new Map<TenseId, Card[]>();
  const seen = new Set(seenIds);
  const queuedIds = new Set(repeatQueue.map((card) => card.id));
  const nextSerialState = { ...serialState };
  const reviewLimit = Math.max(1, Math.floor(count * 0.2));
  const due = shuffle(dueReviews(reviewHistory, now))
    .filter((record) => tenseIds.includes(record.card.tense))
    .slice(0, reviewLimit)
    .map((record) => record.card);
  const dueIds = new Set(due.map((card) => card.id));
  const reviewSlots = new Set(shuffle(Array.from({ length: count }, (_, index) => index)).slice(0, due.length));

  tenseOrder.forEach((tense) => {
    const allowed = CARDS.filter(
      (card) =>
        card.tense === tense &&
        !seen.has(card.id) &&
        !queuedIds.has(card.id) &&
        !dueIds.has(card.id),
    );
    const preferred = shuffle(
      allowed.filter((card) => topicIds.includes(card.topic)),
    );
    const remaining = shuffle(
      allowed.filter((card) => !topicIds.includes(card.topic)),
    );
    pools.set(tense, [...preferred, ...remaining]);
  });

  const deck: DeckCard[] = [];
  const reservedIds = new Set<string>();
  for (let index = 0; index < count; index += 1) {
    const tense = tenseOrder[index % tenseOrder.length];
    const pool = pools.get(tense) ?? [];
    let card = reviewSlots.has(index) ? due.pop() : undefined;
    if (!card) card = pool.shift();

    while (card && reservedIds.has(card.id)) {
      card = pool.shift();
    }

    if (!card) {
      let serial = nextSerialState[tense] ?? 0;
      const topic = topicIds[Math.floor(index / tenseOrder.length) % topicIds.length];
      card = createGeneratedCard(tense, topic, serial);
      while (seen.has(card.id) || reviewHistory[card.id] || reservedIds.has(card.id)) {
        serial += 1;
        card = createGeneratedCard(tense, topic, serial);
      }
      nextSerialState[tense] = serial + 1;
    }

    reservedIds.add(card.id);
    deck.push(shuffleCardOptions(card, `${card.id}-${index}-${Date.now()}`));
  }

  return { cards: deck, nextSerialState };
}

function getTenseLabel(id: TenseId) {
  return TENSES.find((tense) => tense.id === id)?.label ?? id;
}

export default function Home() {
  const [screen, setScreen] = useState<"home" | "setup" | "deck" | "question" | "spot" | "result">(
    "home",
  );
  const [selectedMode, setSelectedMode] = useState<"cards" | "spot-error">("cards");
  const [selectedTenses, setSelectedTenses] = useState<TenseId[]>(DEFAULT_TENSES);
  const [selectedTopics, setSelectedTopics] = useState<TopicId[]>(DEFAULT_TOPICS);
  const [cardCount, setCardCount] = useState(8);
  const [deck, setDeck] = useState<DeckCard[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [spotAnswers, setSpotAnswers] = useState<SpotAnswerRecord[]>([]);
  const [spotDeck, setSpotDeck] = useState<SpotExercise[]>([]);
  const [spotStage, setSpotStage] = useState<"find" | "replace" | "revealed">("find");
  const [spotFirstMistake, setSpotFirstMistake] = useState(false);
  const [spotErrorStage, setSpotErrorStage] = useState<"find" | "replace" | undefined>();
  const [spotSelectedPart, setSpotSelectedPart] = useState<number | null>(null);
  const [spotWrongOptions, setSpotWrongOptions] = useState<string[]>([]);
  const [spotFeedback, setSpotFeedback] = useState("");
  const [savedCurrent, setSavedCurrent] = useState(false);
  const [seenCardIds, setSeenCardIds] = useState<string[]>([]);
  const [repeatQueue, setRepeatQueue] = useState<Card[]>([]);
  const [reviewHistory, setReviewHistory] = useState<ReviewHistory<Card>>({});
  const [spotReviewHistory, setSpotReviewHistory] = useState<ReviewHistory<SpotExercise>>({});
  const [spotSerialState, setSpotSerialState] = useState<SerialState>({});
  const [attemptHistory, setAttemptHistory] = useState<AttemptEvent[]>([]);
  const [serialState, setSerialState] = useState<SerialState>({});
  const [drawIntros, setDrawIntros] = useState<string[]>([]);
  const [progressStats, setProgressStats] = useState<ProgressStats>({
    answered: 0,
    correct: 0,
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [weekNow, setWeekNow] = useState(() => Date.now());
  const committedRoundIds = useRef(new Set<string>());

  const currentCard = deck[cardIndex];
  const currentSpot = spotDeck[cardIndex];
  const currentCorrect =
    selectedAnswer !== null && currentCard
      ? selectedAnswer === currentCard.correctIndex
      : false;
  const activeDeckLength = selectedMode === "cards" ? deck.length : spotDeck.length;
  const progress = activeDeckLength ? ((cardIndex + 1) / activeDeckLength) * 100 : 0;

  // Hydration reads the browser's local progress before the first save.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = window.localStorage.getItem("sense-the-tense-settings");
    if (saved) {
      try {
        const settings = JSON.parse(saved) as {
          tenses?: TenseId[];
          topics?: TopicId[];
          count?: number;
        };
        if (settings.tenses?.length) setSelectedTenses(settings.tenses);
        if (settings.topics?.length) setSelectedTopics(settings.topics);
        if (settings.count && settings.count >= 5 && settings.count <= 99) {
          setCardCount(settings.count);
        }
      } catch {
        window.localStorage.removeItem("sense-the-tense-settings");
      }
    }

    const savedProgress = window.localStorage.getItem(
      "sense-the-tense-progress",
    );
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress) as {
          seenCardIds?: string[];
          repeatQueue?: Card[];
          reviewHistory?: ReviewHistory<Card>;
          serialState?: SerialState;
          stats?: ProgressStats;
          spotReviewHistory?: ReviewHistory<SpotExercise>;
          spotSerialState?: SerialState;
          attempts?: AttemptEvent[];
        };
        if (Array.isArray(progress.seenCardIds)) {
          setSeenCardIds(progress.seenCardIds);
        }
        if (Array.isArray(progress.repeatQueue)) {
          setRepeatQueue(progress.repeatQueue);
        }
        if (progress.reviewHistory && typeof progress.reviewHistory === "object") {
          setReviewHistory(progress.reviewHistory);
        } else if (Array.isArray(progress.repeatQueue)) {
          // Previous saves remain scheduled instead of becoming immediately playable.
          const now = Date.now();
          const migrated = progress.repeatQueue.reduce<ReviewHistory<Card>>(
            (history, card) => recordReview(history, card, false, true, now),
            {},
          );
          setReviewHistory(migrated);
        }
        if (progress.serialState && typeof progress.serialState === "object") {
          setSerialState(progress.serialState);
        }
        if (progress.spotReviewHistory && typeof progress.spotReviewHistory === "object") {
          setSpotReviewHistory(progress.spotReviewHistory);
        }
        if (progress.spotSerialState && typeof progress.spotSerialState === "object") {
          setSpotSerialState(progress.spotSerialState);
        }
        if (Array.isArray(progress.attempts)) {
          setAttemptHistory(trimAttemptHistory(progress.attempts.filter(
            (event) => event && typeof event.id === "string" && typeof event.tense === "string",
          ), Date.now()));
        }
        if (
          progress.stats &&
          Number.isFinite(progress.stats.answered) &&
          Number.isFinite(progress.stats.correct)
        ) {
          setProgressStats(progress.stats);
        }
      } catch {
        window.localStorage.removeItem("sense-the-tense-progress");
      }
    }
    setSettingsLoaded(true);
    setWeekNow(Date.now());
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!settingsLoaded) return;
    window.localStorage.setItem(
      "sense-the-tense-settings",
      JSON.stringify({
        tenses: selectedTenses,
        topics: selectedTopics,
        count: cardCount,
      }),
    );
  }, [selectedTenses, selectedTopics, cardCount, settingsLoaded]);

  useEffect(() => {
    if (!settingsLoaded) return;
    window.localStorage.setItem(
      "sense-the-tense-progress",
      JSON.stringify({
        seenCardIds,
        repeatQueue,
        reviewHistory,
        serialState,
        stats: progressStats,
        spotReviewHistory,
        spotSerialState,
        attempts: attemptHistory,
      }),
    );
  }, [
    seenCardIds,
    repeatQueue,
    reviewHistory,
    serialState,
    progressStats,
    spotReviewHistory,
    spotSerialState,
    attemptHistory,
    settingsLoaded,
  ]);

  const toggleTense = (id: TenseId) => {
    setSelectedTenses((current) =>
      current.includes(id)
        ? current.filter((tense) => tense !== id)
        : [...current, id],
    );
  };

  const toggleTopic = (id: TopicId) => {
    setSelectedTopics((current) =>
      current.includes(id)
        ? current.filter((topic) => topic !== id)
        : [...current, id],
    );
  };

  const startGame = () => {
    if (!selectedTenses.length || !selectedTopics.length) return;
    committedRoundIds.current = new Set();
    if (selectedMode === "spot-error") {
      const built = buildSpotDeck(cardCount, selectedTenses, selectedTopics, spotReviewHistory, spotSerialState, Date.now());
      setSpotDeck(built.exercises);
      setSpotSerialState(built.nextSerialState);
      setSpotAnswers([]);
      setCardIndex(0);
      setSpotStage("find");
      setSpotFirstMistake(false);
      setSpotErrorStage(undefined);
      setSpotSelectedPart(null);
      setSpotWrongOptions([]);
      setSpotFeedback("");
      setShowHint(false);
      setSavedCurrent(false);
      setScreen("spot");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const builtDeck = buildDeck(
      cardCount,
      selectedTenses,
      selectedTopics,
      seenCardIds,
      repeatQueue,
      serialState,
      reviewHistory,
      Date.now(),
    );
    setDeck(builtDeck.cards);
    setSerialState(builtDeck.nextSerialState);
    setDrawIntros(buildIntroSequence(cardCount));
    setCardIndex(0);
    setSelectedAnswer(null);
    setShowHint(false);
    setAnswers([]);
    setSavedCurrent(false);
    setScreen("deck");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const chooseAnswer = (index: number) => {
    if (selectedAnswer !== null || !currentCard) return;
    setSelectedAnswer(index);
  };

  const commitCardAnswer = (): boolean => {
    if (selectedAnswer === null || !currentCard) return false;
    if (committedRoundIds.current.has(currentCard.roundId)) return false;
    committedRoundIds.current.add(currentCard.roundId);
    const nextRecord: AnswerRecord = {
      card: currentCard,
      correct: currentCorrect,
      selectedIndex: selectedAnswer,
      saved: savedCurrent,
    };
    setAnswers((current) => [...current, nextRecord]);
    setAttemptHistory((current) => trimAttemptHistory([...current, {
      id: `cards-${currentCard.id}-${Date.now()}`,
      at: Date.now(), mode: "cards" as ModeId, tense: currentCard.tense,
      firstTryCorrect: currentCorrect, skipped: false,
    }], Date.now()));
    setProgressStats((current) => ({
      answered: current.answered + 1,
      correct: current.correct + (currentCorrect ? 1 : 0),
    }));

    const storedCard = toStoredCard(currentCard);
    setReviewHistory((history) =>
      recordReview(history, storedCard, currentCorrect, savedCurrent, Date.now()),
    );
    if (savedCurrent) {
      setSeenCardIds((current) =>
        current.filter((id) => id !== currentCard.id),
      );
      setRepeatQueue((current) => [
        ...current.filter((card) => card.id !== currentCard.id),
        storedCard,
      ]);
    } else {
      setSeenCardIds((current) =>
        current.includes(currentCard.id)
          ? current
          : [...current, currentCard.id],
      );
      setRepeatQueue((current) =>
        current.filter((card) => card.id !== currentCard.id),
      );
    }
    return true;
  };

  const moveNext = () => {
    if (selectedAnswer === null || !currentCard) return;
    if (!commitCardAnswer()) return;

    if (cardIndex === deck.length - 1) {
      setScreen("result");
    } else {
      setCardIndex((current) => current + 1);
      setSelectedAnswer(null);
      setShowHint(false);
      setSavedCurrent(false);
      setScreen("deck");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetSpotQuestion = () => {
    setSpotStage("find");
    setSpotFirstMistake(false);
    setSpotErrorStage(undefined);
    setSpotSelectedPart(null);
    setSpotWrongOptions([]);
    setSpotFeedback("");
    setShowHint(false);
    setSavedCurrent(false);
  };

  const chooseSpotPart = (index: number) => {
    if (!currentSpot || spotStage !== "find") return;
    if (currentSpot.isClean || index !== currentSpot.targetIndex) {
      setSpotFirstMistake(true);
      setSpotErrorStage((current) => current ?? "find");
      setSpotFeedback("Пока не здесь. Посмотри на временные подсказки в ситуации и предложении.");
      return;
    }
    setSpotSelectedPart(index);
    setSpotFeedback("");
    setSpotStage("replace");
  };

  const chooseNoError = () => {
    if (!currentSpot || spotStage !== "find") return;
    if (currentSpot.isClean) {
      setSpotStage("revealed");
      setSpotFeedback("");
    } else {
      setSpotFirstMistake(true);
      setSpotErrorStage((current) => current ?? "find");
      setSpotFeedback("В этом предложении всё-таки есть форма, которая не совпадает с контекстом.");
    }
  };

  const chooseSpotReplacement = (option: string) => {
    if (!currentSpot || spotStage !== "replace" || spotWrongOptions.includes(option)) return;
    if (option === currentSpot.correctFragment) {
      setSpotFeedback("");
      setSpotStage("revealed");
    } else {
      setSpotFirstMistake(true);
      setSpotErrorStage((current) => current ?? "replace");
      setSpotWrongOptions((current) => [...current, option]);
      setSpotFeedback("Этот вариант ещё не совпадает с историей. Сравни, когда происходит действие.");
    }
  };

  const commitSpotAnswer = (skipped: boolean): boolean => {
    if (!currentSpot) return false;
    if (committedRoundIds.current.has(currentSpot.id)) return false;
    committedRoundIds.current.add(currentSpot.id);
    const correct = !skipped && !spotFirstMistake;
    setSpotAnswers((current) => [...current, {
      exercise: currentSpot, correct, skipped, errorStage: spotErrorStage, saved: savedCurrent,
    }]);
    setAttemptHistory((current) => trimAttemptHistory([...current, {
      id: `spot-${currentSpot.id}-${Date.now()}`,
      at: Date.now(), mode: "spot-error" as ModeId, tense: currentSpot.tense,
      firstTryCorrect: correct, skipped, errorStage: spotErrorStage,
    }], Date.now()));
    setSpotReviewHistory((history) => recordReview(history, currentSpot, correct, savedCurrent, Date.now()));
    return true;
  };

  const moveSpotNext = (skipped = false) => {
    if (!currentSpot || (!skipped && spotStage !== "revealed")) return;
    if (!commitSpotAnswer(skipped)) return;
    if (cardIndex === spotDeck.length - 1) {
      setScreen("result");
    } else {
      setCardIndex((current) => current + 1);
      resetSpotQuestion();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goHome = () => {
    if (["deck", "question", "spot"].includes(screen)) {
      if (!window.confirm("Завершить партию? Уже пройденные задания сохранятся.")) return;
      if (screen === "question" && selectedAnswer !== null) commitCardAnswer();
      if (screen === "spot" && spotStage === "revealed") commitSpotAnswer(false);
    }
    setScreen("home");
    setWeekNow(Date.now());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const completedCorrect = answers.filter((answer) => answer.correct).length;
  const savedCount = answers.filter((answer) => answer.saved).length;
  const lifetimeAccuracy = progressStats.answered
    ? Math.round((progressStats.correct / progressStats.answered) * 100)
    : 0;
  const weekAttempts = recentAttempts(attemptHistory, weekNow);
  const weekSummary = summarizeTenses(weekAttempts);
  const weekAnswered = weekAttempts.filter((event) => !event.skipped).length;
  const weekSkipped = weekAttempts.length - weekAnswered;
  const weekConfident = weekSummary.filter((row) => row.status === "confident");
  const weekSometimes = weekSummary.filter((row) => row.status === "sometimes");
  const weekFocus = weekSummary.filter((row) => row.status === "focus");

  if (screen === "home" || screen === "setup") {
    return (
      <main className={`home-shell ${screen === "home" ? "mode-home" : "setup-home"}`}>
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />

        <header className="home-header">
          <a className="brand" href="#top" aria-label="Sense the Tense — home">
            <span className="brand-mark" aria-hidden="true">
              ST
            </span>
            <span>Sense the Tense</span>
          </a>
        </header>

        <section className="home-grid" id="top">
          <div className="intro-panel">
            <p className="eyebrow">A quiet grammar ritual</p>
            <h1>
              Don’t guess the rule.
              <span>Sense the moment.</span>
            </h1>
            <p className="intro-copy">
              Карточная игра, которая помогает различать английские времена и
              увереннее использовать их в речи.
            </p>

            <div className="deck-preview" aria-hidden="true">
              <div className="preview-card preview-card-left">
                <span>PAST</span>
              </div>
              <div className="preview-card preview-card-main">
                <div className="card-orbit">
                  <i />
                </div>
                <span className="preview-number">XII</span>
                <strong>The Moment</strong>
                <small>language intuition</small>
              </div>
              <div className="preview-card preview-card-right">
                <span>FUTURE</span>
              </div>
            </div>

            <div className="calm-note">
              <span className="calm-line" />
              No timer. No pressure. Just one moment at a time.
            </div>

            <div className="journey-card">
              <div className="journey-heading">
                <div>
                  <p className="step-label">Режим карточек</p>
                  <strong>
                    {progressStats.answered
                      ? "Практика с карточками уже складывается"
                      : "Здесь пока нет открытых карт"}
                  </strong>
                </div>
                <span className="journey-orbit" aria-hidden="true" />
              </div>
              <div className="journey-stats">
                <div>
                  <strong>{progressStats.answered}</strong>
                  <span>cards explored</span>
                </div>
                <div>
                  <strong>{lifetimeAccuracy}%</strong>
                  <span>best matches</span>
                </div>
                <div>
                  <strong>{repeatQueue.length}</strong>
                  <span>saved to repeat</span>
                </div>
              </div>
            </div>
            {screen === "home" && (
              <div className="weekly-card">
                <div className="weekly-heading">
                  <div>
                    <p className="step-label">Последние 7 дней</p>
                    <h2>Твоя практика</h2>
                  </div>
                  <span>{weekAttempts.length} заданий</span>
                </div>
                {weekAttempts.length === 0 ? (
                  <p className="weekly-empty">Сыграй первую партию — здесь появится подсказка, какие времена уже даются легко, а какие стоит повторить.</p>
                ) : weekAnswered === 0 ? (
                  <p className="weekly-empty">На этой неделе было {weekSkipped} пропусков. Ответов для анализа пока нет; пропуски не считаются ошибками.</p>
                ) : (
                  <>
                    {weekSkipped > 0 && <p className="weekly-line">Ответов: {weekAnswered} · пропущено: {weekSkipped}. Пропуски не считаются ошибками.</p>}
                    {weekConfident.length > 0 && <p className="weekly-line"><strong>Уверенно:</strong> {weekConfident.map((row) => getTenseLabel(row.tense)).join(", ")}</p>}
                    {weekSometimes.length > 0 && <p className="weekly-line"><strong>Иногда путается:</strong> {weekSometimes.map((row) => getTenseLabel(row.tense)).join(", ")}</p>}
                    {weekFocus.length > 0 && <p className="weekly-line"><strong>Стоит повторить:</strong> {weekFocus.map((row) => getTenseLabel(row.tense)).join(", ")}</p>}
                    {!weekConfident.length && !weekSometimes.length && !weekFocus.length && <p className="weekly-line">Пока мало данных по каждому времени — продолжай в своём ритме.</p>}
                    <details className="weekly-details">
                      <summary>Все времена и результаты</summary>
                      <div className="weekly-list">
                        {weekSummary.map((row) => (
                          <div key={row.tense}>
                            <span>{getTenseLabel(row.tense)}</span>
                            <strong>{row.correct} из {row.answered}</strong>
                            <small>{row.status === "confident" ? "уверенно" : row.status === "focus" ? "стоит повторить" : row.status === "sometimes" ? "иногда путается" : "пока мало данных"}</small>
                          </div>
                        ))}
                      </div>
                    </details>
                  </>
                )}
              </div>
            )}
          </div>

          {screen === "home" ? (
            <div className="mode-panel">
              <p className="step-label">Choose your practice</p>
              <h2>Как потренируем времена сегодня?</h2>
              <div className="mode-grid">
                <button className="mode-tile is-ready" type="button" onClick={() => { setSelectedMode("cards"); setScreen("setup"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                  <span className="mode-number">01 / The Reading</span><strong>Карточки</strong><span>Почувствуй время через ситуацию и выбери фразу, которая подходит лучше всего.</span><em>Играть ↗</em>
                </button>
                <button className="mode-tile is-ready" type="button" onClick={() => { setSelectedMode("spot-error"); setScreen("setup"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                  <span className="mode-number">02 / The Edit</span><strong>Лови ошибку</strong><span>Найди сбившееся время и аккуратно исправь предложение.</span><em>Играть ↗</em>
                </button>
                <div className="mode-tile is-coming"><span className="mode-number">03 / The Line</span><strong>Таймлайн</strong><span>Разложи события по времени.</span><em>Скоро</em></div>
                <div className="mode-tile is-coming"><span className="mode-number">04 / The Thought</span><strong>Переведи мысль</strong><span>Подбери форму для живой мысли.</span><em>Скоро</em></div>
                <div className="mode-tile is-coming"><span className="mode-number">05 / The Mix</span><strong>Микс</strong><span>Несколько способов думать о времени в одной партии.</span><em>Скоро</em></div>
              </div>
            </div>
          ) : (
          <div className="setup-panel">
            <button className="setup-back" type="button" onClick={() => setScreen("home")}>← Все режимы</button>
            <p className="setup-mode-name">{selectedMode === "cards" ? "01 / Карточки" : "02 / Лови ошибку"}</p>
            <div className="setup-heading">
              <div>
                <p className="step-label">01 · Choose your focus</p>
                <h2>Какие времена потренируем?</h2>
              </div>
              <span className="selection-count">
                {selectedTenses.length} selected
              </span>
            </div>

            <div className="tense-groups">
              {["Present", "Past", "Future"].map((group) => (
                <div className="tense-group" key={group}>
                  <span className="group-label">{group}</span>
                  <div className="chip-row">
                    {TENSES.filter((tense) => tense.group === group).map(
                      (tense) => {
                        const selected = selectedTenses.includes(tense.id);
                        return (
                          <button
                            className={`choice-chip ${selected ? "is-selected" : ""}`}
                            type="button"
                            key={tense.id}
                            aria-pressed={selected}
                            onClick={() => toggleTense(tense.id)}
                          >
                            {tense.label.replace(`${group} `, "")}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="divider" />

            <div className="topic-section">
              <div className="setup-heading compact">
                <div>
                  <p className="step-label">02 · Pick your worlds</p>
                  <h2>Какие ситуации тебе ближе?</h2>
                </div>
              </div>
              <div className="chip-row topic-chips">
                {TOPICS.map((topic) => {
                  const selected = selectedTopics.includes(topic.id);
                  return (
                    <button
                      className={`topic-chip ${selected ? "is-selected" : ""}`}
                      type="button"
                      key={topic.id}
                      aria-pressed={selected}
                      onClick={() => toggleTopic(topic.id)}
                    >
                      {topic.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="divider" />

            <div className="count-section">
              <div>
                <p className="step-label">03 · Set your pace</p>
                <h2>{selectedMode === "cards" ? "Сколько карт откроем?" : "Сколько заданий разберём?"}</h2>
              </div>
              <div
                className="number-picker"
                role="spinbutton"
                tabIndex={0}
                aria-valuemin={5}
                aria-valuemax={99}
                aria-valuenow={cardCount}
                onWheel={(event) => {
                  event.preventDefault();
                  setCardCount((current) =>
                    Math.min(99, Math.max(5, current + (event.deltaY > 0 ? -1 : 1))),
                  );
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowUp" || event.key === "ArrowRight") {
                    setCardCount((current) => Math.min(99, current + 1));
                  }
                  if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
                    setCardCount((current) => Math.max(5, current - 1));
                  }
                }}
                aria-label={`${selectedMode === "cards" ? "Количество карт" : "Количество заданий"}: ${cardCount}`}
              >
                <button
                  type="button"
                  aria-label={`Уменьшить количество ${selectedMode === "cards" ? "карт" : "заданий"}`}
                  onClick={() => setCardCount((current) => Math.max(5, current - 1))}
                >
                  −
                </button>
                <div className="number-window">
                  <span>{String(Math.max(5, cardCount - 1)).padStart(2, "0")}</span>
                  <strong>{String(cardCount).padStart(2, "0")}</strong>
                  <span>{String(Math.min(99, cardCount + 1)).padStart(2, "0")}</span>
                </div>
                <button
                  type="button"
                  aria-label={`Увеличить количество ${selectedMode === "cards" ? "карт" : "заданий"}`}
                  onClick={() => setCardCount((current) => Math.min(99, current + 1))}
                >
                  +
                </button>
              </div>
            </div>
            <input
              className="count-range"
              type="range"
              min="5"
              max="99"
              value={cardCount}
              onChange={(event) => setCardCount(Number(event.target.value))}
              aria-label={`Количество ${selectedMode === "cards" ? "карточек" : "заданий"} от 5 до 99`}
            />

            <button
              className="start-button"
              type="button"
              disabled={
                !settingsLoaded ||
                !selectedTenses.length ||
                !selectedTopics.length
              }
              onClick={startGame}
            >
              <span>Start</span>
              <span className="button-arrow">↗</span>
            </button>
            {!selectedTenses.length && (
              <p className="validation-note">Выбери хотя бы одно время.</p>
            )}
            {!selectedTopics.length && (
              <p className="validation-note">Выбери хотя бы одну тему.</p>
            )}
          </div>
          )}
        </section>
      </main>
    );
  }

  if (screen === "result") {
    if (selectedMode === "spot-error") {
      const answered = spotAnswers.filter((answer) => !answer.skipped);
      const correct = answered.filter((answer) => answer.correct).length;
      const skipped = spotAnswers.length - answered.length;
      const percentage = answered.length ? Math.round((correct / answered.length) * 100) : 0;
      return (
        <main className="game-shell result-shell">
          <div className="ambient ambient-one" />
          <GameHeader onHome={goHome} />
          <section className="result-card">
            <div className="result-symbol" aria-hidden="true"><span>{percentage}</span><small>%</small></div>
            <p className="eyebrow">The edit is complete</p>
            <h1>Все предложения разобраны</h1>
            <p className="result-lead">Посмотри, какие времена уже узнаются легко, а какие стоит встретить ещё раз.</p>
            <div className="result-stats">
              <div><strong>{answered.length}</strong><span>ответов</span></div>
              <div><strong>{correct}</strong><span>с первого раза</span></div>
              <div><strong>{skipped}</strong><span>пропущено</span></div>
            </div>
            <SessionAnalysis
              events={spotAnswers.map((answer, index) => ({
                id: `${index}`, at: 0, mode: "spot-error", tense: answer.exercise.tense,
                firstTryCorrect: answer.correct, skipped: answer.skipped, errorStage: answer.errorStage,
              }))}
              mistakes={spotAnswers.filter((answer) => !answer.correct && !answer.skipped).map((answer) => ({
                id: answer.exercise.id,
                original: answer.exercise.sentence,
                corrected: answer.exercise.correctSentence,
                explanation: answer.exercise.explanation,
                detail: answer.exercise.isClean ? "Здесь ошибки не было." : answer.errorStage === "find" ? "Сначала было трудно найти фрагмент." : "Фрагмент найден, но замена потребовала ещё попытки.",
              }))}
            />
            <div className="result-actions">
              <button className="primary-action" type="button" onClick={startGame}>Ещё одна партия</button>
              <button className="text-action" type="button" onClick={goHome}>Все режимы</button>
            </div>
          </section>
        </main>
      );
    }
    const percentage = answers.length
      ? Math.round((completedCorrect / answers.length) * 100)
      : 0;

    return (
      <main className="game-shell result-shell">
        <div className="ambient ambient-one" />
        <GameHeader onHome={goHome} />
        <section className="result-card">
          <div className="result-symbol" aria-hidden="true">
            <span>{percentage}</span>
            <small>%</small>
          </div>
          <p className="eyebrow">Your reading is complete</p>
          <h1>Вся колода пройдена</h1>
          <p className="result-lead">
            {percentage >= 80
              ? "Временные линии складываются очень уверенно."
              : percentage >= 55
                ? "Интуиция уже работает — теперь закрепим тонкие различия."
                : "Хорошее начало: ошибки здесь не оценка, а карта следующего шага."}
          </p>

          <div className="result-stats">
            <div>
              <strong>{answers.length}</strong>
              <span>cards explored</span>
            </div>
            <div>
              <strong>{completedCorrect}</strong>
              <span>best matches</span>
            </div>
            <div>
              <strong>{savedCount}</strong>
              <span>saved to repeat</span>
            </div>
          </div>

          <SessionAnalysis
            events={answers.map((answer, index) => ({
              id: `${index}`, at: 0, mode: "cards", tense: answer.card.tense,
              firstTryCorrect: answer.correct, skipped: false,
            }))}
            mistakes={answers.filter((answer) => !answer.correct).map((answer) => ({
              id: answer.card.id,
              original: answer.card.options[answer.selectedIndex],
              corrected: answer.card.options[answer.card.correctIndex],
              explanation: answer.card.explanation,
              detail: answer.card.situation,
            }))}
          />

          <div className="result-actions">
            <button className="primary-action" type="button" onClick={startGame}>
              Play the same mix
            </button>
            <button className="text-action" type="button" onClick={goHome}>
              Change settings
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "spot" && currentSpot) {
    return (
      <main className="game-shell spot-shell">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <GameHeader onHome={goHome} />
        <div className="game-progress" aria-label={`Задание ${cardIndex + 1} из ${spotDeck.length}`}>
          <div><span>Задание {String(cardIndex + 1).padStart(2, "0")}</span><span>из {String(spotDeck.length).padStart(2, "0")}</span></div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        </div>
        <section className="spot-board" data-exercise-id={currentSpot.id}>
          <div className="spot-board-top"><span>02 / The Edit</span><span>{TOPICS.find((topic) => topic.id === currentSpot.topic)?.label}</span></div>
          <p className="eyebrow">Найди сбившееся время</p>
          <h1>{currentSpot.situation}</h1>
          <p className="spot-instruction">{spotStage === "find" ? "Нажми на фрагмент, который кажется неверным. Если предложение уже верное — так и отметь." : spotStage === "replace" ? "Теперь выбери форму, которая подходит истории." : "Сравни две версии и прочитай объяснение."}</p>
          <div className="spot-paper">
            <span className="spot-paper-label">THE SENTENCE / {String(cardIndex + 1).padStart(2, "0")}</span>
            <div className="spot-sentence" aria-label={currentSpot.sentence}>
              {currentSpot.parts.map((part, index) => (
                <button
                  className={`spot-fragment ${spotSelectedPart === index ? "is-selected" : ""}`}
                  type="button"
                  key={`${index}-${part}`}
                  disabled={spotStage !== "find"}
                  onClick={() => chooseSpotPart(index)}
                  aria-label={`Проверить фрагмент: ${part}`}
                >{part}</button>
              ))}
            </div>
          </div>
          {spotStage !== "revealed" && (
            <>
              <div className="spot-tools">
                <button className="hint-button" type="button" aria-expanded={showHint} onClick={() => setShowHint((current) => !current)}>
                  <span>{showHint ? "Скрыть подсказку" : "Нужна подсказка?"}</span><span>{showHint ? "−" : "+"}</span>
                </button>
                {spotStage === "find" && <button className="spot-no-error" type="button" onClick={chooseNoError}>Ошибки нет</button>}
              </div>
              {showHint && <p className="hint-text">{currentSpot.hint}</p>}
              {spotFeedback && <p className="spot-feedback" role="status">{spotFeedback}</p>}
              {spotStage === "replace" && (
                <div className="spot-replacements" aria-label="Варианты исправления">
                  <p className="step-label">Подходящая замена</p>
                  {currentSpot.options.map((option) => (
                    <button className={`spot-replacement ${spotWrongOptions.includes(option) ? "is-tried" : ""}`} type="button" key={option} disabled={spotWrongOptions.includes(option)} onClick={() => chooseSpotReplacement(option)}>{option}<span>↗</span></button>
                  ))}
                </div>
              )}
              <button className="spot-skip" type="button" onClick={() => moveSpotNext(true)}>Пропустить вопрос →</button>
            </>
          )}
          {spotStage === "revealed" && (
            <div className="spot-reveal">
              <p className="step-label">До → после</p>
              {currentSpot.isClean ? <p className="spot-after">{currentSpot.sentence}</p> : (
                <><p className="spot-before">{currentSpot.sentence}</p><p className="spot-after">{currentSpot.correctSentence}</p></>
              )}
              <p>{currentSpot.isClean ? "В этом предложении время уже подходило ситуации." : currentSpot.explanation}</p>
              <div className="reveal-actions">
                <button className={`save-button ${savedCurrent ? "is-saved" : ""}`} type="button" aria-pressed={savedCurrent} onClick={() => setSavedCurrent((current) => !current)}>
                  <span>{savedCurrent ? "Saved to repeat" : "Repeat this later"}</span><span>{savedCurrent ? "✓" : "+"}</span>
                </button>
                <button className="next-button" type="button" onClick={() => moveSpotNext()}>{cardIndex === spotDeck.length - 1 ? "Посмотреть разбор" : "Следующее задание"}<span>→</span></button>
              </div>
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="game-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <GameHeader onHome={goHome} />

      <div className="game-progress" aria-label={`Card ${cardIndex + 1} of ${deck.length}`}>
        <div>
          <span>Card {String(cardIndex + 1).padStart(2, "0")}</span>
          <span>of {String(deck.length).padStart(2, "0")}</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {screen === "deck" && currentCard && (
        <section className="draw-stage">
          <div className="draw-copy">
            <p className="eyebrow">A moment is waiting</p>
            <h1>
              Карта {cardIndex + 1}
              <span>готова открыться</span>
            </h1>
            <p>{drawIntros[cardIndex] ?? DRAW_INTROS[0]}</p>
            <button
              className="primary-action open-action"
              type="button"
              onClick={() => setScreen("question")}
            >
              Open card
              <span>↗</span>
            </button>
          </div>
          <button
            className="tarot-back"
            type="button"
            aria-label="Открыть следующую карту"
            onClick={() => setScreen("question")}
          >
            <span className="tarot-frame">
              <span className="tarot-stars">· · ·</span>
              <span className="tarot-moon">
                <i />
              </span>
              <span className="tarot-title">
                <strong>Sense</strong>
                <small>the Tense</small>
              </span>
              <span className="tarot-roman">XII</span>
            </span>
          </button>
        </section>
      )}

      {screen === "question" && currentCard && (
        <section className="question-card" data-card-id={currentCard.id}>
          <div className="card-topline">
            <span>{getTenseLabel(currentCard.tense)}</span>
            <span>{TOPICS.find((topic) => topic.id === currentCard.topic)?.label}</span>
          </div>

          <div className="question-heading">
            <p className="card-roman">{String(cardIndex + 1).padStart(2, "0")}</p>
            <p className="eyebrow">{currentCard.title}</p>
            <h1>{currentCard.situation}</h1>
            <p className="english-prompt">{currentCard.prompt}</p>
          </div>

          {selectedAnswer === null && (
            <button
              className="hint-button"
              type="button"
              aria-expanded={showHint}
              onClick={() => setShowHint((current) => !current)}
            >
              <span>{showHint ? "Hide hint" : "Need a gentle hint?"}</span>
              <span>{showHint ? "−" : "+"}</span>
            </button>
          )}
          {showHint && selectedAnswer === null && (
            <p className="hint-text">{currentCard.hint}</p>
          )}

          <div className="options-list" aria-label="Answer options">
            {currentCard.options.map((option, index) => {
              const isChosen = selectedAnswer === index;
              const isCorrect = index === currentCard.correctIndex;
              const revealed = selectedAnswer !== null;
              return (
                <button
                  className={`answer-option ${isChosen ? "is-chosen" : ""} ${revealed && isCorrect ? "is-correct" : ""} ${revealed && isChosen && !isCorrect ? "is-almost" : ""}`}
                  type="button"
                  key={option}
                  disabled={revealed}
                  onClick={() => chooseAnswer(index)}
                >
                  <span className="option-letter">{index + 1}</span>
                  <span>{option}</span>
                  {revealed && isCorrect && <span className="option-status">best match</span>}
                </button>
              );
            })}
          </div>

          {selectedAnswer !== null && (
            <div className={`answer-reveal ${currentCorrect ? "correct" : "almost"}`}>
              <div className="reveal-heading">
                <div>
                  <p className="step-label">
                    {currentCorrect ? "You sensed it" : "Almost — notice the timeline"}
                  </p>
                  <h2>{currentCorrect ? "Best match" : "Here’s the difference"}</h2>
                </div>
                <span className="reveal-mark" aria-hidden="true">
                  {currentCorrect ? "✓" : "~"}
                </span>
              </div>
              <p>{currentCard.explanation}</p>
              <p className="contrast-copy">{currentCard.contrast}</p>
              <div className="marker-line">
                <span>TIME SIGNAL</span>
                <strong>{currentCard.marker}</strong>
              </div>
              <div className="reveal-actions">
                <button
                  className={`save-button ${savedCurrent ? "is-saved" : ""}`}
                  type="button"
                  aria-pressed={savedCurrent}
                  onClick={() => setSavedCurrent((current) => !current)}
                >
                  <span>{savedCurrent ? "Saved to repeat" : "Repeat this later"}</span>
                  <span>{savedCurrent ? "✓" : "+"}</span>
                </button>
                <button className="next-button" type="button" onClick={moveNext}>
                  {cardIndex === deck.length - 1 ? "See my reading" : "Next card"}
                  <span>→</span>
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function GameHeader({ onHome }: { onHome: () => void }) {
  return (
    <header className="game-header">
      <button className="brand brand-button" type="button" onClick={onHome}>
        <span className="brand-mark" aria-hidden="true">
          ST
        </span>
        <span>Sense the Tense</span>
      </button>
      <button className="quiet-exit" type="button" onClick={onHome}>
        В меню
      </button>
    </header>
  );
}

type MistakeDetail = { id: string; original: string; corrected: string; explanation: string; detail: string };

function SessionAnalysis({ events, mistakes }: { events: AttemptEvent[]; mistakes: MistakeDetail[] }) {
  const rows = summarizeTenses(events, 3);
  const strengths = rows.filter((row) => row.answered > 0 && row.correct === row.answered);
  const practice = rows.filter((row) => row.answered > 0 && row.correct < row.answered)
    .sort((a, b) => a.correct / a.answered - b.correct / b.answered);
  const focus = practice.find((row) => row.answered >= 3);
  const skipped = events.filter((event) => event.skipped).length;
  return (
    <div className="session-analysis">
      <div className="analysis-title"><p className="step-label">Разбор партии</p><h2>Как ощущаются времена</h2></div>
      {strengths.length > 0 && <p className="analysis-note"><strong>Без ошибок:</strong> {strengths.map((row) => `${getTenseLabel(row.tense)} (${row.correct}/${row.answered})`).join(", ")}.</p>}
      {practice.length > 0 && <p className="analysis-note"><strong>Потренировать:</strong> {practice.map((row) => `${getTenseLabel(row.tense)} (${row.correct}/${row.answered})`).join(", ")}.</p>}
      {focus && <p className="analysis-note"><strong>Чаще ошибки:</strong> {getTenseLabel(focus.tense)} — {focus.answered - focus.correct} из {focus.answered} ответов потребовали ещё попытки.</p>}
      {!strengths.length && !practice.length && <p className="analysis-note">Пока нет ответов для анализа.</p>}
      {rows.some((row) => row.answered > 0 && row.answered < 3) && <p className="analysis-caution">По некоторым временам пока мало ответов — это наблюдение за партией, не оценка знаний.</p>}
      {skipped > 0 && <p className="analysis-caution">Пропущено: {skipped}. Эти задания не считаются ошибками и смогут вернуться позже.</p>}
      <details className="mistake-details">
        <summary>Посмотреть ошибки ({mistakes.length})</summary>
        {mistakes.length ? mistakes.map((mistake, index) => (
          <article className="mistake-item" key={`${mistake.id}-${index}`}>
            <span>{mistake.detail}</span>
            <p className="spot-before">{mistake.original}</p>
            <p className="spot-after">{mistake.corrected}</p>
            <small>{mistake.explanation}</small>
          </article>
        )) : <p className="analysis-note">В этой партии ошибок нет.</p>}
      </details>
    </div>
  );
}
