"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  userId: Id<"users">;
}

const defaultMembers = ["Corinne", "Joey", "Anthony", "Roma"];

function startOfWeekSunday(date = new Date()) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split("T")[0];
}

export function FamilyMeetingDashboard({ userId }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const weekOf = startOfWeekSunday();

  const meeting = useQuery(api.familyMeeting.getFamilyMeetingByWeek, { userId, weekOf });
  const discussionQueue = useQuery(api.familyMeeting.getDiscussionQueue, { userId }) || [];
  const movieItems = useQuery(api.familyMeeting.getMovieItems, { userId }) || [];

  const saveMeeting = useMutation(api.familyMeeting.saveFamilyMeeting);
  const addDiscussion = useMutation(api.familyMeeting.addDiscussionItem);
  const updateDiscussionStatus = useMutation(api.familyMeeting.updateDiscussionStatus);
  const addMovieSuggestion = useMutation(api.familyMeeting.addMovieSuggestion);
  const voteMovie = useMutation(api.familyMeeting.voteMovie);
  const markMovieWatched = useMutation(api.familyMeeting.markMovieWatched);
  const seedDemo = useMutation(api.familyMeeting.seedDemoData);

  const [memberFrom, setMemberFrom] = useState(defaultMembers[0]);
  const [memberTo, setMemberTo] = useState(defaultMembers[1]);
  const [ackMessage, setAckMessage] = useState("");
  const [discussionItem, setDiscussionItem] = useState("");
  const [movieTitle, setMovieTitle] = useState("");
  const [movieBy, setMovieBy] = useState(defaultMembers[0]);
  const [goalPerson, setGoalPerson] = useState(defaultMembers[0]);
  const [goalText, setGoalText] = useState("");
  const [habitFocus, setHabitFocus] = useState("");
  const [supportPerson, setSupportPerson] = useState(defaultMembers[0]);
  const [supportText, setSupportText] = useState("");
  const [gameName, setGameName] = useState("");
  const [gameWinner, setGameWinner] = useState(defaultMembers[0]);
  const [gameMoment, setGameMoment] = useState("");

  const familyMembers = meeting?.familyMembers || defaultMembers;

  // Disabled demo seed - start with clean data
  // useEffect(() => {
  //   if (meeting === null) {
  //     seedDemo({ userId, today, weekOf });
  //   }
  // }, [meeting, seedDemo, today, userId, weekOf]);

  const suggestions = movieItems.filter((m) => m.type === "suggestion");
  const watched = movieItems.filter((m) => m.type === "watched");
  const activeQueue = discussionQueue.filter((q) => q.status !== "archived");

  const meetingDoc = useMemo(() => {
    return {
      familyMembers,
      acknowledgements: meeting?.acknowledgements || [],
      supportRequests: meeting?.supportRequests || [],
      goals: meeting?.goals || [],
      mealPlan: meeting?.mealPlan || [],
      gameNights: meeting?.gameNights || [],
    };
  }, [familyMembers, meeting]);

  const persistMeeting = async (next: Partial<typeof meetingDoc>) => {
    await saveMeeting({
      userId,
      weekOf,
      familyMembers: next.familyMembers ?? meetingDoc.familyMembers,
      acknowledgements: next.acknowledgements ?? meetingDoc.acknowledgements,
      supportRequests: next.supportRequests ?? meetingDoc.supportRequests,
      goals: next.goals ?? meetingDoc.goals,
      mealPlan: next.mealPlan ?? meetingDoc.mealPlan,
      gameNights: next.gameNights ?? meetingDoc.gameNights,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Family Meeting Dashboard</h2>
        <p className="text-sm text-muted-foreground">Week of {weekOf}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Acknowledgements & Shout-Outs</CardTitle>
            <CardDescription>Track who recognized who this week.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Select value={memberFrom} onValueChange={setMemberFrom}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{familyMembers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={memberTo} onValueChange={setMemberTo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{familyMembers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Textarea value={ackMessage} onChange={(e) => setAckMessage(e.target.value)} placeholder="What are you acknowledging?" />
            <Button onClick={async () => {
              if (!ackMessage.trim()) return;
              await persistMeeting({
                acknowledgements: [...meetingDoc.acknowledgements, { from: memberFrom, to: memberTo, message: ackMessage.trim(), createdAt: Date.now() }],
              });
              setAckMessage("");
            }}>Add Acknowledgement</Button>
            <div className="space-y-2">
              {meetingDoc.acknowledgements.map((a, i) => (
                <div key={i} className="text-sm border rounded p-2"><b>{a.from}</b> → <b>{a.to}</b>: {a.message}</div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Discussion Queue</CardTitle>
            <CardDescription>Add during the week, resolve during Sunday meeting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input value={discussionItem} onChange={(e) => setDiscussionItem(e.target.value)} placeholder="Add topic" />
              <Button onClick={async () => {
                if (!discussionItem.trim()) return;
                await addDiscussion({ userId, item: discussionItem.trim(), addedBy: "Family" });
                setDiscussionItem("");
              }}>Add</Button>
            </div>
            <div className="space-y-2">
              {activeQueue.map((q) => (
                <div key={q._id} className="border rounded p-2 space-y-2">
                  <div className="text-sm">{q.item}</div>
                  <Select
                    value={q.status}
                    onValueChange={(v: "queued" | "resolved" | "tabled" | "action-needed" | "archived") =>
                      updateDiscussionStatus({ id: q._id, status: v })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="queued">Queued</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="tabled">Tabled</SelectItem>
                      <SelectItem value="action-needed">Action Needed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendar Review (Next 7 Days)</CardTitle>
            <CardDescription>Support requests + conflict flags.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Select value={supportPerson} onValueChange={setSupportPerson}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{familyMembers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
              <Input value={supportText} onChange={(e) => setSupportText(e.target.value)} placeholder="Support request" />
            </div>
            <Button onClick={async () => {
              if (!supportText.trim()) return;
              await persistMeeting({
                supportRequests: [...meetingDoc.supportRequests, { person: supportPerson, request: supportText.trim(), conflict: false }],
              });
              setSupportText("");
            }}>Add Request</Button>
            <div className="space-y-2">
              {meetingDoc.supportRequests.map((s, i) => (
                <div key={i} className="border rounded p-2 flex items-center justify-between">
                  <span className="text-sm"><b>{s.person}</b>: {s.request}</span>
                  <Button size="sm" variant={s.conflict ? "default" : "outline"} onClick={async () => {
                    const next = [...meetingDoc.supportRequests];
                    next[i] = { ...next[i], conflict: !next[i].conflict };
                    await persistMeeting({ supportRequests: next });
                  }}>{s.conflict ? "Conflict" : "No conflict"}</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goals & Habit Trackers</CardTitle>
            <CardDescription>Weekly goals per person.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <Select value={goalPerson} onValueChange={setGoalPerson}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{familyMembers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
              <Input value={goalText} onChange={(e) => setGoalText(e.target.value)} placeholder="Weekly goal" />
              <Input value={habitFocus} onChange={(e) => setHabitFocus(e.target.value)} placeholder="Habit focus" />
            </div>
            <Button onClick={async () => {
              if (!goalText.trim()) return;
              await persistMeeting({ goals: [...meetingDoc.goals, { person: goalPerson, goal: goalText.trim(), habitFocus: habitFocus.trim(), completed: false }] });
              setGoalText("");
              setHabitFocus("");
            }}>Add Goal</Button>
            <div className="space-y-2">
              {meetingDoc.goals.map((g, i) => (
                <div key={i} className="border rounded p-2 flex items-center justify-between text-sm">
                  <span><b>{g.person}</b>: {g.goal} {g.habitFocus ? `• ${g.habitFocus}` : ""}</span>
                  <Button size="sm" variant={g.completed ? "default" : "outline"} onClick={async () => {
                    const next = [...meetingDoc.goals];
                    next[i] = { ...next[i], completed: !next[i].completed };
                    await persistMeeting({ goals: next });
                  }}>{g.completed ? "Done" : "Open"}</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Friday Movie Nights 🎬</CardTitle>
            <CardDescription>Suggestions, voting, watched history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Input value={movieTitle} onChange={(e) => setMovieTitle(e.target.value)} placeholder="Movie suggestion" />
              <Select value={movieBy} onValueChange={setMovieBy}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{familyMembers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={async () => {
              if (!movieTitle.trim()) return;
              await addMovieSuggestion({ userId, title: movieTitle.trim(), suggestedBy: movieBy });
              setMovieTitle("");
            }}>Add Movie</Button>
            <div className="space-y-2">
              {suggestions.map((m) => (
                <div key={m._id} className="border rounded p-2 text-sm space-y-2">
                  <div className="flex items-center justify-between"><span>{m.title}</span><span>{m.votes.length} votes</span></div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => voteMovie({ id: m._id, voter: "Corinne" })}>Vote</Button>
                    <Button size="sm" onClick={() => markMovieWatched({ id: m._id, rating: 5, notes: "Great family pick", favorite: false })}>Mark Watched</Button>
                  </div>
                </div>
              ))}
              {watched.slice(0, 4).map((m) => (
                <div key={m._id} className="border rounded p-2 text-xs text-muted-foreground">Watched: {m.title} {m.rating ? `• ${m.rating}/5` : ""} {m.favorite ? "⭐" : ""}</div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Game Night Log</CardTitle>
            <CardDescription>Track game, winner, and fun moments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={gameName} onChange={(e) => setGameName(e.target.value)} placeholder="Game played" />
            <Select value={gameWinner} onValueChange={setGameWinner}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{familyMembers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea value={gameMoment} onChange={(e) => setGameMoment(e.target.value)} placeholder="Fun moment" />
            <Button onClick={async () => {
              if (!gameName.trim()) return;
              await persistMeeting({ gameNights: [...meetingDoc.gameNights, { game: gameName.trim(), winner: gameWinner, moment: gameMoment.trim(), date: today }] });
              setGameName("");
              setGameMoment("");
            }}>Add Game Night</Button>
            <div className="space-y-2">
              {meetingDoc.gameNights.map((g, i) => (
                <div key={i} className="border rounded p-2 text-sm">{g.date}: <b>{g.game}</b> - Winner: {g.winner || "-"} {g.moment ? `• ${g.moment}` : ""}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🎉 End of Year Reflection (Coming 2027)</CardTitle>
          <CardDescription>
            Yearly wrap-up: acknowledgements, goals, movie nights, game winners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled variant="outline">Available December 2026</Button>
        </CardContent>
      </Card>
    </div>
  );
}
