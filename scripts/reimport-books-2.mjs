#!/usr/bin/env node
import { spawnSync } from "child_process";

const USER_ID = "kx77km204g5c9m51b0280eegh1821dne";

// More books from screenshots (continuing from where we left off)
const books = [
  // More from previous screenshots I missed + continuing
  { title: "The Land of Stories: The Wishing Spell", author: "Chris Colfer", category: "Fiction" },
  { title: "The Land of Stories: The Enchantress Returns", author: "Chris Colfer", category: "Fiction" },
  { title: "Mariel of Redwall", author: "Brian Jacques", category: "Fiction" },
  { title: "Marie Antoinette", author: "Who Was", category: "Biography" },
  { title: "Nelson Mandela", author: "Who Was", category: "Biography" },
  { title: "Once and Future King", author: "T.H. White", category: "Literature" },
  { title: "One Dead Spy", author: "Nathan Hale", category: "History" },
  { title: "Osmosis Jones", author: "", category: "Science" },
  { title: "Panda-monium", author: "Stuart Gibbs", category: "Fiction" },
  { title: "Pearl Harbor", author: "Who Was", category: "History" },
  { title: "Poached", author: "Stuart Gibbs", category: "Fiction" },
  { title: "Primitive Technology", author: "John Plant", category: "Skills" },
  { title: "Queen Elizabeth II", author: "Who Was", category: "Biography" },
  { title: "Redwall", author: "Brian Jacques", category: "Fiction" },
  { title: "Rich Dad Poor Dad for Teens", author: "Robert Kiyosaki", category: "Financial" },
  { title: "Science Inspectors", author: "", category: "Science" },
  { title: "Spy Camp", author: "Stuart Gibbs", category: "Fiction" },
  { title: "Spy School", author: "Stuart Gibbs", category: "Fiction" },
  { title: "Spy School Secret Service", author: "Stuart Gibbs", category: "Fiction" },
  { title: "Spy Ski School", author: "Stuart Gibbs", category: "Fiction" },
  { title: "Story of the World Vol 1: Ancient Times", author: "Susan Wise Bauer", category: "History" },
  { title: "Story of the World Vol 2: Middle Ages", author: "Susan Wise Bauer", category: "History" },
  { title: "Story of the World Vol 3: Early Modern", author: "Susan Wise Bauer", category: "History" },
  { title: "Story of the World Vol 4: Modern Age", author: "Susan Wise Bauer", category: "History" },
  { title: "The Disappearing Spoon", author: "Sam Kean", category: "Science" },
  { title: "The Fun Jungle", author: "Stuart Gibbs", category: "Fiction" },
  { title: "The Story of My Life", author: "Helen Keller", category: "Biography" },
  { title: "The Way We Work", author: "David Macaulay", category: "Science" },
  { title: "The Wonderful Wizard of Oz", author: "L. Frank Baum", category: "Literature" },
  { title: "Treasury of Norse Mythology", author: "Donna Jo Napoli", category: "Mythology" },
  { title: "Treaties, Trenches, Mud and Blood", author: "Nathan Hale", category: "History" },
  { title: "Tuck Everlasting", author: "Natalie Babbitt", category: "Literature" },
  { title: "Tuttle Twins and the Creature from Jekyll Island", author: "Connor Boyack", category: "Financial" },
  { title: "Tuttle Twins and the Education Vacation", author: "Connor Boyack", category: "Civics" },
  { title: "Tuttle Twins and the Food Truck Fiasco", author: "Connor Boyack", category: "Civics" },
  { title: "Tuttle Twins and the Golden Rule", author: "Connor Boyack", category: "Civics" },
  { title: "Tuttle Twins and the Hyperinflation Devastation", author: "Connor Boyack", category: "Financial" },
  { title: "Tuttle Twins and the Leviathan Crisis", author: "Connor Boyack", category: "Civics" },
  { title: "Tuttle Twins and the Miraculous Pencil", author: "Connor Boyack", category: "Civics" },
  { title: "Tuttle Twins and the Road to Surfdom", author: "Connor Boyack", category: "Civics" },
  { title: "Tuttle Twins and the Search for Atlas", author: "Connor Boyack", category: "Civics" },
  { title: "Tuttle Twins and the Tuttle Twins Guide to Inspiring Entrepreneurs", author: "Connor Boyack", category: "Financial" },
  { title: "Tuttle Twins History Volume 1", author: "Connor Boyack", category: "History" },
  { title: "Tuttle Twins History Volume 2", author: "Connor Boyack", category: "History" },
  { title: "Tuttle Twins History Volume 3", author: "Connor Boyack", category: "History" },
  { title: "U.S. Presidential History Bites", author: "Solomon Schmidt", category: "History" },
  { title: "Usborne Time Traveler", author: "Usborne", category: "History" },
  { title: "Way of the Warrior Kid", author: "Jocko Willink", category: "Fiction" },
  { title: "Way of the Warrior Kid 2: Marc's Mission", author: "Jocko Willink", category: "Fiction" },
  { title: "Way of the Warrior Kid 3", author: "Jocko Willink", category: "Fiction" },
  { title: "What Was the Boston Tea Party", author: "Who Was", category: "History" },
  { title: "Who Was Abraham Lincoln", author: "Who Was", category: "Biography" },
  { title: "Who Was Albert Einstein", author: "Who Was", category: "Biography" },
  { title: "Who Was King Tut", author: "Who Was", category: "History" },
  { title: "Who Was Leonardo da Vinci", author: "Who Was", category: "Biography" },
  { title: "Who Was Rosa Parks", author: "Who Was", category: "Biography" },
  { title: "Wings of Fire: The Dragonet Prophecy", author: "Tui T. Sutherland", category: "Fiction" },
  { title: "Wings of Fire: The Lost Heir", author: "Tui T. Sutherland", category: "Fiction" },
  { title: "Wings of Fire: The Hidden Kingdom", author: "Tui T. Sutherland", category: "Fiction" },
  { title: "Wonder", author: "R.J. Palacio", category: "Fiction" },
  { title: "Pucks Go Vroom", author: "", category: "Fiction" },
  { title: "Children's Homer", author: "Padraic Colum", category: "Literature" },
  { title: "Tuesdays at the Castle", author: "Jessica Day George", category: "Fiction" },
  { title: "Angus Adams: Free-Range Kid", author: "Lee M. Winter", category: "Fiction" },
  { title: "The Proto Project", author: "Bryan R. Johnson", category: "STEM" },
  { title: "Escape the Rat Race", author: "Robert Kiyosaki", category: "Financial" },
  { title: "Campground Kids: Rocky Mountain", author: "C.R. Fulton", category: "Fiction" },
  { title: "Time Flies: Articles of Confederation", author: "Carol Kerney", category: "History" },
  { title: "Time Flies: Mayflower Compact", author: "Carol Kerney", category: "History" },
  { title: "Time Flies: Colonial Charters", author: "Carol Kerney", category: "History" },
  { title: "Boy Who Harnessed the Wind", author: "William Kamkwamba", category: "Biography" },
  { title: "America's History 1776-1791", author: "Connor Boyack", category: "History" },
];

function runConvex(fn, argsObj) {
  const argsJson = JSON.stringify(argsObj);
  const res = spawnSync("npx", ["convex", "run", fn, argsJson], {
    cwd: new URL("..", import.meta.url).pathname,
    encoding: "utf8",
    timeout: 30000,
  });
  return { stdout: res.stdout, stderr: res.stderr, status: res.status };
}

console.log(`Re-importing ${books.length} more books...`);
let added = 0;
let failed = 0;

for (const book of books) {
  const args = {
    userId: USER_ID,
    title: book.title,
    author: book.author || undefined,
    category: book.category || undefined,
    status: "want-to-read",
  };
  
  const result = runConvex("books:addBookToLibrary", args);
  if (result.status === 0) {
    added++;
    console.log(`✓ ${book.title}`);
  } else {
    failed++;
    console.log(`✗ ${book.title}`);
  }
}

console.log(`\nBatch 2 done! Added: ${added}, Failed: ${failed}`);
