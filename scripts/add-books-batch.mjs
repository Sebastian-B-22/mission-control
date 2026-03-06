#!/usr/bin/env node
/**
 * Batch add books and set covers via follow-up patch.
 * Uses spawnSync (no shell) to avoid quoting issues.
 */

import { spawnSync } from "child_process";

const USER_ID = "kx77km204g5c9m51b0280eegh1821dne";

const books = [
  { title: "America's History 1776-1791", author: "Connor Boyack & Elijah Stanfield", coverUrl: "/books/americas-history-1776-tuttle-twins.jpg", category: "History" },
  { title: "The Way We Work", author: "David Macaulay", coverUrl: "/books/the-way-we-work-macaulay.jpg", category: "Science" },
  { title: "U.S. Presidential History Bites", author: "Solomon Schmidt", coverUrl: "/books/us-presidential-history-bites.jpg", category: "History" },
  { title: "Anne Frank: The Diary of a Young Girl", author: "Anne Frank", coverUrl: "/books/anne-frank-diary.jpg", category: "Biography" },
  { title: "The Children's Homer", author: "Padraic Colum", coverUrl: "/books/childrens-homer.jpg", category: "Literature" },
  { title: "Tuesdays at the Castle", author: "Jessica Day George", coverUrl: "/books/tuesdays-at-the-castle.jpg", category: "Fiction" },
  { title: "Angus Adams: The Adventures of a Free-Range Kid", author: "Lee M. Winter", coverUrl: "/books/angus-adams.jpg", category: "Fiction" },
  { title: "The Proto Project", author: "Bryan R. Johnson", coverUrl: "/books/proto-project.jpg", category: "STEM" },
  { title: "Primitive Technology", author: "John Plant", coverUrl: "/books/primitive-technology.jpg", category: "Skills" },
  { title: "Little Britches: Father and I Were Ranchers", author: "Ralph Moody", coverUrl: "/books/little-britches.jpg", category: "Literature" },
  { title: "The Story of My Life", author: "Helen Keller", coverUrl: "/books/story-of-my-life-helen-keller.jpg", category: "Biography" },
  { title: "The Big History Timeline Wallbook", author: "What on Earth!", coverUrl: "/books/big-history-timeline-wallbook.jpg", category: "History" },
  { title: "How to Teach Your Children Shakespeare", author: "Ken Ludwig", coverUrl: "/books/how-to-teach-shakespeare.jpg", category: "Education" },
  { title: "The Usborne Time Traveler", author: "Usborne", coverUrl: "/books/usborne-time-traveler.jpg", category: "History" },
  { title: "How to Be a Person", author: "Catherine Newman", coverUrl: "/books/how-to-be-a-person.jpg", category: "Life Skills" },
  { title: "Leon Garfield's Shakespeare Stories", author: "Leon Garfield", coverUrl: "/books/leon-garfield-shakespeare.jpg", category: "Literature" },
  { title: "The Boy Who Harnessed the Wind", author: "William Kamkwamba", coverUrl: "/books/boy-who-harnessed-wind.jpg", category: "Biography" },
  { title: "Who Was King Tut?", author: "Roberta Edwards", coverUrl: "/books/who-was-king-tut.jpg", category: "History" },
  { title: "Escape the Rat Race", author: "Robert Kiyosaki", coverUrl: "/books/escape-the-rat-race.jpg", category: "Financial" },
  { title: "The Campground Kids: Rocky Mountain Challenge", author: "C.R. Fulton", coverUrl: "/books/campground-kids-rocky-mountain.jpg", category: "Fiction" },
  { title: "Time Flies: Articles of Confederation", author: "Carol Kerney", coverUrl: "/books/time-flies-articles-confederation.jpg", category: "History" },
  { title: "Time Flies: The Mayflower Compact", author: "Carol Kerney", coverUrl: "/books/time-flies-mayflower-compact.jpg", category: "History" },
  { title: "Time Flies: Colonial Charters", author: "Carol Kerney", coverUrl: "/books/time-flies-colonial-charters.jpg", category: "History" },
];

function runConvex(fn, argsObj) {
  const argsJson = JSON.stringify(argsObj);
  const res = spawnSync("npx", ["convex", "run", fn, argsJson], {
    cwd: new URL("..", import.meta.url).pathname,
    encoding: "utf8",
  });
  if (res.status !== 0) {
    throw new Error((res.stderr || res.stdout || "").trim());
  }
  return (res.stdout || "").trim();
}

let added = 0;
let patched = 0;
let failed = 0;

for (const book of books) {
  try {
    // Deployed validator currently accepts only: userId,title,author?,category?
    const out = runConvex("books:addBookToLibrary", {
      userId: USER_ID,
      title: book.title,
      author: book.author,
      category: book.category,
    });

    // Out is usually a JSON string id, e.g. "kx..."
    const id = JSON.parse(out);
    added++;

    // Patch in coverUrl
    runConvex("books:updateBookCover", { id, coverUrl: book.coverUrl });
    patched++;

    console.log(`✓ ${book.title}`);
  } catch (e) {
    failed++;
    console.error(`✗ ${book.title}: ${e.message}`);
  }
}

console.log(`\nDone. Added: ${added}, Cover updated: ${patched}, Failed: ${failed}`);
