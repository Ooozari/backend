import express, { Request, Response } from "express";

const app = express();
const port = 3000;

// ozari github api
const dataOoozari = {
  login: "Ooozari",
  id: 153997825,
  node_id: "U_kgDOCS3SAQ",
  avatar_url: "https://avatars.githubusercontent.com/u/153997825?v=4",
  gravatar_id: "",
  url: "https://api.github.com/users/Ooozari",
  html_url: "https://github.com/Ooozari",
  followers_url: "https://api.github.com/users/Ooozari/followers",
  following_url: "https://api.github.com/users/Ooozari/following{/other_user}",
  gists_url: "https://api.github.com/users/Ooozari/gists{/gist_id}",
  starred_url: "https://api.github.com/users/Ooozari/starred{/owner}{/repo}",
  subscriptions_url: "https://api.github.com/users/Ooozari/subscriptions",
  organizations_url: "https://api.github.com/users/Ooozari/orgs",
  repos_url: "https://api.github.com/users/Ooozari/repos",
  events_url: "https://api.github.com/users/Ooozari/events{/privacy}",
  received_events_url: "https://api.github.com/users/Ooozari/received_events",
  type: "User",
  user_view_type: "public",
  site_admin: false,
  name: "Uzair Asif",
  company: null,
  blog: "https://uzair-portfolio-three.vercel.app/",
  location: "Pakistan",
  email: null,
  hireable: null,
  bio: "Website Application Developer.",
  twitter_username: null,
  public_repos: 24,
  public_gists: 0,
  followers: 8,
  following: 12,
  created_at: "2023-12-16T13:11:09Z",
  updated_at: "2025-09-12T07:32:02Z",
};
// Basic GET route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.get("/github", (req: Request, res: Response) => {
  res.json(dataOoozari);
});
// Start server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
