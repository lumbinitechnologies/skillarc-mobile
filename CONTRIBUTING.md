# Contributing to SkillArc Mobile

## From React to React Native

The React state and component model is familiar; the rendered elements are native. Use `View`, `Text`, `Pressable`, `TextInput`, `FlatList`, and `StyleSheet` rather than HTML/CSS/DOM APIs. Expo Router screens belong in `src/app`; keep feature components and tests under `src/features` or `src/ui`. Read the [Expo Router guide](https://docs.expo.dev/router/introduction/) and the [React Native core components guide](https://reactnative.dev/docs/components-and-apis) before your first screen. Check both Android and iOS: back navigation, keyboard, safe areas, permissions, fonts, and file pickers differ.

Keane owns Expo/EAS configuration, Supabase, authentication, `src/api`, contract generation, and any dependency with native setup. Ask on your issue before adding a package or editing those areas. Never import Next.js/server code, calculate official grades or attendance, or place service keys or real student data in this public repository.

## One issue, one branch, one PR

1. Work only from your group's assigned issue. It states the Jira key, captain, allowed paths, fixture or API revision, dependency, and acceptance criteria. A missing API is a blocker to report, not permission to invent data rules.
2. Fork this repository and branch from current `main`, e.g. `SCRUM-27-g2-student-home`. Open a draft PR early. Keep the Jira key in commits and title.
3. Update your branch with `git fetch upstream` and `git rebase upstream/main`. Resolve conflicts in your own files; use `git push --force-with-lease` only on your own rebased fork branch.
4. Run `npm run check`. Write behavior tests for success, empty, loading, error, expired-session, and poor-network states. For writes, test retry and duplicate prevention. Attach Android/iOS screenshots or recordings from the development build.
5. Request a captain peer review, then Keane's approval. Resolve every conversation. Keane squash merges after checks pass. If another group owns a file, split the change or request Keane to coordinate it.

Use synthetic staging users only. State any AI assistance and what you verified yourself. Never paste secrets or student records into prompts, commits, public issues, or screenshots. Report a possible data leak privately to Keane.

## Group directories

G1 owns the shell/navigation; G2 student academics; G3 assignments/submissions; G4 faculty content; G5 attendance/leave; G6 grades/reports; G7 parent views; G8 theme/UI/device harness. The issue's allowed paths take precedence over this summary. Keane directly leads all eight groups and Sai Kiran's separate solo work.

Dependabot dependency PRs are the one Jira-key exception. They may change only manifests, lockfiles, or workflow action versions and still require Keane's approval.
