/** Form cues — chest, back, shoulders, biceps, triceps, forearms. Keyed by
 * exact catalog name. 2-3 short, coachable cues each: setup, the one thing
 * that most often goes wrong, and what to feel. */
export const UPPER_CUES: Record<string, string[]> = {
  // --- Chest -----------------------------------------------------------------
  'Barbell Bench Press (Flat)': [
    'Shoulder blades pinched and down, slight arch, feet planted',
    'Lower to mid-chest with elbows ~45°, not flared to 90°',
    'Drive the bar up and slightly back over your shoulders',
  ],
  'Barbell Bench Press (Incline 30°)': [
    'Blades back and down; bar touches just below the collarbone',
    'Elbows tucked ~45°, forearms vertical at the bottom',
    'Press straight up — keep your butt on the bench',
  ],
  'Barbell Bench Press (Incline 45°)': [
    'Bar lands high on the chest, near the collarbone',
    "Keep shoulder blades set — don't let shoulders roll forward",
    'Steeper angle = more front delt; control the descent',
  ],
  'Barbell Bench Press (Incline 60°)': [
    'Mostly a shoulder press — expect lighter loads',
    'Bar to upper chest/chin line, elbows slightly in front',
    'Brace hard; avoid leaning back to make it flatter',
  ],
  'Barbell Bench Press (Decline)': [
    'Hook your legs in securely before unracking',
    'Lower to the bottom of the chest',
    'Short range — control it, no bouncing',
  ],
  'Dumbbell Bench Press (Flat)': [
    'Kick the dumbbells up off your knees to get set',
    'Lower until elbows are just below the bench, wrists stacked',
    'Press up and slightly in — no clanking at the top',
  ],
  'Dumbbell Bench Press (Incline 30°)': [
    'Blades pinched, dumbbells at upper-chest level',
    'Elbows ~45°, forearms vertical',
    'Press up in a slight arc toward each other',
  ],
  'Dumbbell Bench Press (Incline 60°)': [
    'Shoulder-dominant — keep the load moderate',
    'Lower to shoulder level with elbows slightly forward',
    "Don't let the lower back peel off the pad",
  ],
  'Dumbbell Bench Press (Decline)': [
    'Secure your legs before bringing the weights into position',
    'Lower to the bottom of the chest, elbows ~45°',
    'Controlled tempo — decline makes it easy to rush',
  ],
  'Machine Chest Press (Flat)': [
    'Set the seat so handles line up with mid-chest',
    'Blades back against the pad the whole set',
    "Full stretch, then press without locking out hard",
  ],
  'Machine Chest Press (Incline)': [
    'Handles at upper-chest height when seated',
    'Keep shoulders down and back, not shrugged',
    'Slow negative; stop just short of the stack touching',
  ],
  'Smith Machine Bench Press (Flat)': [
    'Position the bench so the bar lands on mid-chest',
    'Same setup as barbell: blades pinched, feet planted',
    'Fixed path — make sure the bottom lines up before loading heavy',
  ],
  'Smith Machine Bench Press (Incline)': [
    'Bench placed so the bar meets the upper chest',
    'Elbows ~45°, forearms vertical at the bottom',
    'Control the descent; set the safeties',
  ],
  'Cable Chest Press (Standing, Flat)': [
    'Staggered stance, brace your core',
    'Handles at chest height; press straight out',
    "Don't let the cables pull your shoulders forward at the back",
  ],
  'Cable Fly (High-to-Low)': [
    'Slight lean forward, soft fixed bend in the elbows',
    'Sweep down and in toward your hips',
    'Squeeze at the bottom; think "hug a tree"',
  ],
  'Cable Fly (Low-to-High)': [
    'Pulleys low, palms up, slight elbow bend',
    'Sweep up and in to chin height',
    'Feel the upper chest — not the front delts taking over',
  ],
  'Cable Fly (Mid / Flat)': [
    'Pulleys at chest height, one step forward',
    'Arc the handles together in front of your chest',
    "Keep elbows locked in a slight bend — it's not a press",
  ],
  'Dumbbell Fly (Flat)': [
    'Slight bend in the elbows, fixed through the rep',
    'Lower in a wide arc until you feel a chest stretch',
    'Stop the stretch at shoulder level — no deeper',
  ],
  'Dumbbell Fly (Incline)': [
    'Bench ~30°, palms facing each other',
    'Wide arc down to a comfortable stretch',
    'Bring them together over the upper chest',
  ],
  'Pec Deck / Machine Fly': [
    'Seat set so handles are at chest height',
    'Chest up, blades back against the pad',
    'Squeeze the handles together; slow on the way back',
  ],
  'Push-Up (Standard)': [
    'Hands just outside shoulders, body one straight line',
    'Chest to an inch off the floor, elbows ~45°',
    "Squeeze glutes and abs — don't let hips sag",
  ],
  'Push-Up (Incline, hands elevated)': [
    'Hands on a bench/box; higher = easier',
    'Straight line head to heels',
    'Touch your chest to the edge each rep',
  ],
  'Push-Up (Decline, feet elevated)': [
    'Feet on a bench, hands under shoulders',
    'Keep hips level — no piking',
    'More upper-chest/shoulder emphasis',
  ],
  'Push-Up (Wide Grip)': [
    'Hands 1.5x shoulder width, fingers slightly out',
    'Lower with control; chest leads',
    'Keep the core tight so the back stays flat',
  ],
  'Push-Up (Close-Grip / Diamond)': [
    'Hands together under the chest',
    'Elbows track back close to your ribs',
    'Triceps-heavy — regress to knees if form breaks',
  ],
  'Dip (Chest-Focused, forward lean)': [
    'Lean the torso forward ~30°, elbows slightly flared',
    'Lower until shoulders are just below elbows',
    "Stop short of pain — don't sink into the bottom",
  ],
  'Landmine Press': [
    'Staggered stance, bar end at the shoulder',
    'Press up and forward along the bar path',
    "Brace the core so you don't twist",
  ],
  'Floor Press (Barbell)': [
    'Lie under the bar, knees bent or legs straight',
    'Lower until triceps touch the floor, pause',
    'Press from a dead stop — no bouncing the elbows',
  ],
  'Svend Press / Plate Squeeze Press': [
    'Squeeze plates together hard between flat palms',
    'Press straight out from the chest',
    'Keep squeezing the whole time — that is the exercise',
  ],
  'Dumbbell Pullover': [
    'Hold one dumbbell over the chest, slight elbow bend',
    'Lower behind the head until you feel lats and chest stretch',
    'Pull back over the chest keeping arms nearly straight',
  ],
  'Hex Press (Dumbbell Squeeze Press, Flat)': [
    'Press the dumbbells together hard',
    'Lower to the chest keeping them touching',
    'Squeeze drives the chest; the weight can stay light',
  ],
  'Decline Dumbbell Fly': [
    'Secure legs; slight elbow bend',
    'Arc down to a stretch at chest level',
    'Bring them together over the lower chest',
  ],
  'Resistance Band Chest Press (Standing)': [
    'Band anchored behind you at chest height',
    'Staggered stance, brace',
    'Press forward and together; resist on the way back',
  ],
  'Single-Arm Dumbbell Bench Press (Flat)': [
    'Free hand braces on the bench or your side',
    "Don't let the torso rotate toward the weight",
    'Great core anti-rotation bonus — go lighter',
  ],
  'Single-Arm Cable Crossover (Standing)': [
    'Stand side-on to the pulley, slight lean',
    'Sweep the handle across the body past midline',
    'Squeeze at full crossover',
  ],
  'Spoto Press': [
    'Bench press that stops an inch above the chest',
    'Pause 1 second without touching, stay tight',
    'Press from the pause — builds control off the chest',
  ],
  'Larsen Press': [
    'Legs straight/raised — no leg drive',
    'Keep the upper-back set; lower to chest',
    'Lighter than normal; pure upper-body press',
  ],
  'Archer Push-Up': [
    'Wide hands; shift weight to one side as you lower',
    'Other arm stays straight like a bow string',
    'Alternate sides; progression toward one-arm push-ups',
  ],
  'Dumbbell Floor Press': [
    'Lower until upper arms touch the floor',
    'Pause, stay tight, then press',
    'Shoulder-friendly — limited range by design',
  ],
  'Deficit Push-Up': [
    'Hands on plates/handles so chest drops below hands',
    'Go into the extra stretch slowly',
    'Keep the body rigid the whole rep',
  ],

  // --- Back ------------------------------------------------------------------
  'Pull-Up (Wide Grip, Pronated)': [
    'Start from a dead hang, shoulders pulled down first',
    'Drive elbows down toward your back pockets',
    'Chin over the bar, then lower all the way with control',
  ],
  'Chin-Up (Supinated Grip)': [
    'Palms facing you, shoulder-width grip',
    'Pull the chest to the bar, elbows close',
    "Full hang at the bottom — no half reps",
  ],
  'Lat Pulldown (Wide Grip)': [
    'Thighs locked under the pads, slight lean back',
    'Pull the bar to the upper chest, elbows down and back',
    "Don't yank with body swing; control the return",
  ],
  'Lat Pulldown (Close Grip, Neutral)': [
    'Neutral handle, sit tall with a slight lean',
    'Pull to the upper chest, elbows tight to your sides',
    'Let the lats stretch fully at the top',
  ],
  'Barbell Bent-Over Row (Overhand)': [
    'Hinge to ~45°, flat back, knees soft',
    'Pull the bar to your lower chest/upper belly',
    "Torso stays still — don't stand up to move the weight",
  ],
  'Barbell Bent-Over Row (Underhand)': [
    'Palms up, hinge with a flat back',
    'Row to the belly button, elbows close',
    'More lat and biceps than the overhand version',
  ],
  'Dumbbell One-Arm Row': [
    'Hand and knee on a bench, flat back',
    'Pull the dumbbell toward your hip, not your armpit',
    "Don't twist the torso open at the top",
  ],
  'Seated Cable Row (Close Grip)': [
    'Sit tall, slight knee bend, chest up',
    'Row to the belly, squeeze the shoulder blades together',
    'Let the shoulders reach forward on the return — no torso rocking',
  ],
  'T-Bar Row': [
    'Hinge with a flat back over the bar',
    'Row to the chest/belly, elbows at ~45°',
    'Keep the chest up; avoid jerking the weight',
  ],
  'Chest-Supported Row (Machine)': [
    'Chest on the pad, feet planted',
    'Pull elbows back past your torso',
    'Pause and squeeze; no chest lifting off the pad',
  ],
  'Chest-Supported Row (Dumbbell)': [
    'Chest on an incline bench, arms hanging',
    'Row elbows back, squeezing the blades',
    'Strict — the bench removes all body English',
  ],
  'Straight-Arm Cable Pulldown': [
    'Slight hinge, arms nearly straight',
    'Sweep the bar down to your thighs using the lats',
    "Don't bend the elbows to cheat it down",
  ],
  'Barbell Deadlift (Conventional)': [
    'Bar over mid-foot, shins close, hips between knees and shoulders',
    'Brace, pull the slack out, push the floor away',
    'Bar stays against the legs; stand tall, no leaning back',
  ],
  'Barbell Deadlift (Sumo)': [
    'Wide stance, toes out, grip inside the knees',
    'Push the knees out and chest up before pulling',
    'Drive the floor apart and lock out the hips',
  ],
  'Back Extension (Hyperextension)': [
    'Pad at the hip crease, not the belly',
    'Hinge down with a neutral spine',
    "Rise to a straight line — don't hyperextend at the top",
  ],
  'Barbell Shrug': [
    'Stand tall, arms straight',
    'Shrug straight up toward the ears',
    'Hold 1 second at the top; no rolling the shoulders',
  ],
  'Dumbbell Shrug': [
    'Dumbbells at your sides, arms straight',
    'Shrug straight up and hold briefly',
    'Lower all the way for a full stretch',
  ],
  'Face Pull': [
    'Rope at face height, thumbs toward you',
    'Pull to the face, elbows high and wide',
    'Finish by rotating hands back — "double biceps" pose',
  ],
  'Meadows Row (Landmine)': [
    'Staggered stance, side-on to the bar end',
    'Row with an overhand grip, elbow flared a bit',
    'Big stretch at the bottom, control each rep',
  ],
  'Inverted Row (Bodyweight)': [
    'Body straight under a bar, heels down',
    'Pull the chest to the bar',
    'Walk feet forward to make it easier',
  ],
  'Renegade Row (Dumbbell)': [
    'Push-up position on dumbbells, feet wide',
    'Row one side without twisting the hips',
    'Slow and controlled — core is the limiter',
  ],
  'Pendlay Row (Barbell)': [
    'Torso nearly parallel to the floor',
    'Explode the bar to the lower chest',
    'Return it to the floor each rep, reset your back',
  ],
  'Trap Bar Deadlift': [
    'Stand centered in the bar, handles in line with feet',
    'Hips lower than a conventional pull, chest up',
    'Push through the floor and stand tall',
  ],
  'Rack Pull': [
    'Bar set at or just below the knees',
    'Same setup as a deadlift: brace and push the floor',
    'Lock out with glutes — no hitching the bar up the thighs',
  ],
  'Superman (Prone Back Extension)': [
    'Lie face down, arms overhead',
    'Lift arms, chest and legs a few inches',
    'Hold briefly; keep the neck neutral',
  ],
  'Reverse Hyperextension (Machine)': [
    'Hips on the edge of the pad, hold the handles',
    'Swing the legs up with the glutes, not momentum',
    'Stop at hip level; control the lowering',
  ],
  "Farmer's Carry": [
    'Heavy weights at your sides, stand tall',
    'Short quick steps, shoulders down and back',
    "Don't let the weights swing or the torso lean",
  ],
  'Scapular Pull-Up': [
    'Dead hang with straight arms',
    'Pull the shoulder blades down without bending elbows',
    'Small range — builds the start of every pull-up',
  ],
  'Single-Arm Lat Pulldown (Cable)': [
    'Kneel or sit side-on, arm fully stretched overhead',
    'Pull the elbow down to your side',
    'Big stretch at the top; no torso lean',
  ],
  'Wide-Grip Seated Cable Row': [
    'Wide bar, sit tall',
    'Row to the lower chest, elbows out ~60°',
    'Hits upper back and rear delts more than close grip',
  ],
  'Deficit Deadlift': [
    'Stand on a 1–3" platform',
    'Same brace as a deadlift, hips a bit lower',
    'Builds speed off the floor — go lighter',
  ],
  'Snatch-Grip Deadlift': [
    'Very wide grip, hips lower than normal',
    'Keep the chest up and back flat',
    'Great for upper back — expect to use less weight',
  ],
  'Seal Row': [
    'Lie face down on a high bench',
    'Row the bar/dumbbells to the bench',
    'Zero momentum — pure upper back',
  ],
  'Neutral-Grip Pull-Up': [
    'Palms facing each other on parallel handles',
    'Pull the chest up, elbows close to your sides',
    'Shoulder-friendly; full range each rep',
  ],
  'Kroc Row': [
    'Heavy one-arm dumbbell row with a bit of body English',
    'High reps; keep the back flat',
    'Pull to the hip, control the stretch',
  ],
  'Banded Pull-Apart': [
    'Arms straight at shoulder height',
    'Pull the band apart until it touches the chest',
    'Squeeze the blades; keep shoulders down',
  ],

  // --- Shoulders -------------------------------------------------------------
  'Barbell Overhead Press (Standing)': [
    'Grip just outside shoulders, squeeze glutes and abs',
    'Move the head back, press the bar straight up',
    'Head through at the top — bar over mid-foot',
  ],
  'Dumbbell Shoulder Press (Seated)': [
    'Back against the pad, dumbbells at ear level',
    'Press up and slightly in',
    "Don't arch the lower back off the seat",
  ],
  'Dumbbell Shoulder Press (Incline 60°)': [
    'Back on a 60° bench, weights at shoulder level',
    'Press up in line with the torso',
    'Slight chest emphasis vs. a vertical press',
  ],
  'Machine Shoulder Press': [
    'Handles start at shoulder height',
    'Press up without locking out hard',
    'Keep the back on the pad',
  ],
  'Arnold Press': [
    'Start palms facing you in front of the face',
    'Rotate palms out as you press up',
    'Reverse the rotation on the way down',
  ],
  'Barbell Push Press': [
    'Short knee dip, torso upright',
    'Drive with the legs, finish with the arms',
    'Lock out overhead, lower back to the shoulders',
  ],
  'Pike Push-Up': [
    'Hips high, body in an upside-down V',
    'Lower the head toward the floor in front of hands',
    'Press back up; elevate feet to progress',
  ],
  'Landmine Shoulder Press': [
    'Half-kneeling or standing, bar at the shoulder',
    'Press up and forward, reaching at the top',
    'Shoulder-friendly angle — brace the core',
  ],
  'Front Raise (Dumbbell)': [
    'Slight elbow bend, palms down',
    'Raise to eye level, no higher',
    'No swinging — lower slowly',
  ],
  'Dumbbell Lateral Raise': [
    'Slight forward lean, soft elbows',
    'Lead with the elbows out to the sides',
    'Stop at shoulder height; control the drop',
  ],
  'Cable Lateral Raise': [
    'Cable crosses in front of the body from a low pulley',
    'Raise out to shoulder height',
    'Constant tension — keep it slow',
  ],
  'Machine Lateral Raise': [
    'Pads on the outside of the upper arms',
    'Raise to shoulder height leading with elbows',
    'Pause at the top; no shrugging',
  ],
  'Barbell Upright Row': [
    'Grip at least shoulder width',
    'Pull elbows up and out to chest height',
    "Stop if you feel shoulder pinching — don't go to the chin",
  ],
  'Cable Upright Row': [
    'Rope or bar on a low pulley, wide grip',
    'Lead with the elbows to chest height',
    'Smooth tension; stop short of any pinch',
  ],
  'Cuban Press': [
    'Upright row to elbows at 90°',
    'Rotate the forearms up (external rotation)',
    'Press overhead; very light weight',
  ],
  'Bent-Over Rear Delt Raise (Dumbbell)': [
    'Hinge with a flat back, arms hanging',
    'Raise out to the sides, pinkies slightly up',
    "Don't squeeze the blades — keep it in the rear delts",
  ],
  'Reverse Pec Deck (Machine)': [
    'Chest against the pad, handles at shoulder height',
    'Sweep the arms back in an arc',
    'Stop at your torso line; slow return',
  ],
  'Cable Rear Delt Fly': [
    'Cross the cables, arms at shoulder height',
    'Pull out and back in a wide arc',
    'Arms nearly straight; feel the back of the shoulder',
  ],
  'Incline Y-Raise (Dumbbell)': [
    'Chest on an incline bench, thumbs up',
    'Raise the arms into a Y overhead',
    'Very light — targets lower traps',
  ],
  'Z Press': [
    'Sit on the floor, legs straight',
    'Press overhead with no back support',
    'Stay upright — the core does real work',
  ],
  'Handstand Push-Up': [
    'Against a wall, hands just wider than shoulders',
    'Lower the head to the floor in a tripod',
    'Press back up; use a pad under the head',
  ],
  'Behind-the-Neck Press': [
    'Only if you have good shoulder mobility',
    'Lower the bar to the base of the skull, no further',
    'Keep the load moderate; press straight up',
  ],
  'Lean-Away Cable Lateral Raise': [
    'Hold a post, lean away from the cable',
    'Raise to shoulder height',
    'Bigger stretch at the bottom than a standard raise',
  ],
  'Chest-Supported Dumbbell Reverse Fly': [
    'Chest on an incline bench',
    'Raise the arms out to the sides',
    'No momentum possible — go light',
  ],
  'Scarecrow (Dumbbell)': [
    'Elbows at shoulder height, forearms hanging',
    'Rotate forearms up to vertical',
    'Slow and light — rotator cuff work',
  ],
  'W-Raise (Dumbbell)': [
    'Chest on an incline bench, elbows bent',
    'Pull back into a W shape, squeezing the blades',
    'Light weight, controlled',
  ],
  'Wide-Grip Rear Delt Row (Cable)': [
    'Wide grip, elbows flared to shoulder height',
    'Row to the upper chest',
    'Focus on the back of the shoulders',
  ],
  'Single-Arm Cable Front Raise': [
    'Cable from a low pulley behind you',
    'Raise to eye level with a slight elbow bend',
    'Controlled lowering',
  ],
  'Kettlebell Shoulder Press': [
    'Bell resting in the rack position',
    'Press up, rotating the palm forward',
    'Keep the wrist straight',
  ],
  'Plate Front Raise': [
    'Hold a plate at 3 and 9 o’clock',
    'Raise to eye level',
    'No lean back to heave it up',
  ],
  'Resistance Band Lateral Raise': [
    'Stand on the band, handles at sides',
    'Raise to shoulder height',
    'Tension builds at the top — pause there',
  ],
  'Kettlebell Halo': [
    'Hold the bell upside down by the horns',
    'Circle it slowly around the head',
    'Keep ribs down and core braced',
  ],

  // --- Biceps ----------------------------------------------------------------
  'Barbell Curl (Straight Bar)': [
    'Elbows pinned at your sides',
    'Curl without swinging the hips',
    'Full extension at the bottom each rep',
  ],
  'EZ-Bar Curl': [
    'Grip the angled parts of the bar',
    'Elbows stay still at your sides',
    'Squeeze at the top, lower slowly',
  ],
  'Dumbbell Curl (Standing, Supinating)': [
    'Start palms in, rotate palms up as you curl',
    'Keep elbows by your sides',
    'Lower all the way to straight arms',
  ],
  'Incline Dumbbell Curl': [
    'Lie back on a 45–60° bench, arms hanging',
    'Curl without bringing elbows forward',
    'Big stretch at the bottom — go lighter',
  ],
  'Preacher Curl (Barbell/EZ-Bar)': [
    'Armpits snug to the top of the pad',
    "Lower to almost straight — don't hyperextend",
    'Curl up without lifting elbows off the pad',
  ],
  'Preacher Curl (Dumbbell)': [
    'One arm at a time over the pad',
    'Control the bottom of the rep',
    'Squeeze hard at the top',
  ],
  'Hammer Curl (Dumbbell)': [
    'Palms facing each other the whole rep',
    'Elbows at your sides',
    'Hits brachialis and forearm too',
  ],
  'Cross-Body Hammer Curl': [
    'Neutral grip, curl across toward the opposite shoulder',
    'Keep the elbow close to the body',
    'Alternate arms, no swinging',
  ],
  'Cable Curl (Straight Bar)': [
    'Stand close to the pulley, elbows at sides',
    'Curl up, squeeze',
    'Constant tension — control the return',
  ],
  'Cable Curl (Rope, Hammer Grip)': [
    'Neutral grip on the rope',
    'Curl up and split the rope slightly at the top',
    'Elbows fixed',
  ],
  'Concentration Curl': [
    'Seated, elbow braced against the inner thigh',
    'Curl up and squeeze',
    'Slow negative; no body movement',
  ],
  'Reverse Curl (Barbell, Pronated Grip)': [
    'Palms down, shoulder-width grip',
    'Curl up keeping wrists straight',
    'Forearm and brachialis focus — lighter weight',
  ],
  'Spider Curl': [
    'Chest on an incline bench, arms hanging straight down',
    'Curl up with no shoulder movement',
    'Hard squeeze at the top',
  ],
  'Zottman Curl': [
    'Curl up palms up',
    'Rotate to palms down at the top',
    'Lower slowly with palms down',
  ],
  'Machine Bicep Curl': [
    'Elbows lined up with the machine pivot',
    'Full range, squeeze at the top',
    'Slow lowering',
  ],
  'Drag Curl (Barbell)': [
    'Drag the bar up your torso',
    'Elbows travel back, not forward',
    'Lighter than a normal curl',
  ],
  'Overhead Cable Curl (Bayesian Curl)': [
    'Face away from a low pulley, arm behind you',
    'Curl forward keeping the elbow back',
    'Big stretch on the biceps at the start',
  ],
  'Wide-Grip Barbell Curl': [
    'Hands wider than shoulders',
    'Elbows at sides, no swing',
    'Emphasizes the short (inner) head',
  ],
  'Band Curl': [
    'Stand on the band, palms up',
    'Curl up; tension peaks at the top',
    'Slow on the way down',
  ],
  'Single-Arm Cable Curl (Low Pulley)': [
    'Stand side-on or facing the pulley',
    'Curl up, elbow fixed',
    'Full stretch between reps',
  ],
  'Close-Grip EZ-Bar Curl': [
    'Grip the inner angles of the bar',
    'Elbows at sides',
    'Emphasizes the long (outer) head',
  ],
  'Seated Incline Hammer Curl': [
    'Lie back on an incline bench, neutral grip',
    'Curl without moving the elbows forward',
    'Stretch at the bottom',
  ],
  'High Cable Curl (Peak Contraction)': [
    'Arms out to the sides at shoulder height',
    'Curl the handles toward your head',
    'Squeeze the peak contraction',
  ],
  "Waiter's Curl (Dumbbell)": [
    'Hold one dumbbell flat by the plate end with both palms',
    'Curl up keeping it level',
    'Slow tempo — hard squeeze at the top',
  ],
  'Barbell 21s': [
    '7 reps bottom half, 7 top half, 7 full range',
    'Elbows at your sides throughout',
    'Use a lighter weight than normal curls',
  ],

  // --- Triceps ---------------------------------------------------------------
  'Cable Pushdown (Straight Bar)': [
    'Elbows pinned to your sides',
    'Push down to full lockout',
    "Don't let the elbows drift forward on the way up",
  ],
  'Cable Pushdown (Rope)': [
    'Elbows at sides, rope at chest height',
    'Push down and spread the rope apart at the bottom',
    'Control the return to 90°',
  ],
  'Overhead Cable Triceps Extension': [
    'Face away from the pulley, rope behind the head',
    'Extend the arms forward and up',
    'Keep elbows pointing ahead; big stretch at the start',
  ],
  'Overhead Dumbbell Triceps Extension (Two-Hand)': [
    'Hold one dumbbell overhead with both hands',
    'Lower behind the head, elbows pointing up',
    'Extend fully; keep ribs down',
  ],
  'Single-Arm Overhead Dumbbell Extension': [
    'Elbow points up next to the head',
    'Lower the dumbbell behind the head',
    'Extend without the elbow flaring out',
  ],
  'Skull Crusher (EZ-Bar, to Forehead)': [
    'Upper arms vertical, only the elbows bend',
    'Lower the bar to just above the forehead',
    'Extend fully; keep elbows from flaring',
  ],
  'Skull Crusher (Incline, Behind Head)': [
    'Upper arms angled slightly back',
    'Lower the bar behind the head',
    'Big long-head stretch — use moderate weight',
  ],
  'Close-Grip Bench Press': [
    'Grip about shoulder width',
    'Elbows tucked close to the body',
    'Touch the lower chest and press',
  ],
  'Dip (Triceps-Focused, upright torso)': [
    'Torso upright, elbows back',
    'Lower until elbows reach ~90°',
    'Press to full lockout',
  ],
  'Triceps Kickback (Dumbbell)': [
    'Hinge forward, upper arm parallel to the floor',
    'Extend the forearm straight back',
    'Pause at lockout; no swinging',
  ],
  'Cable Triceps Kickback': [
    'Hinge forward, cable from a low pulley',
    'Upper arm fixed, extend back',
    'Squeeze at full extension',
  ],
  'JM Press': [
    'Close grip, lower the bar toward the chin/throat',
    'Elbows point forward, halfway between press and skull crusher',
    'Press back up; moderate weight',
  ],
  'Machine Triceps Extension': [
    'Elbows lined up with the machine pivot',
    'Extend fully',
    'Control the return',
  ],
  'Bench Dip': [
    'Hands on a bench behind you, legs out',
    'Lower until elbows are ~90°',
    "Don't go deeper if shoulders complain",
  ],
  'Tate Press': [
    'Dumbbells over the chest, elbows flared',
    'Lower the dumbbells toward the chest by bending elbows',
    'Extend back up; light weight',
  ],
  'V-Bar Cable Pushdown': [
    'Elbows pinned to sides',
    'Push down to lockout',
    'Slow return',
  ],
  'Reverse-Grip (Underhand) Cable Pushdown': [
    'Palms up on the bar',
    'Elbows at sides; push down',
    'Lighter weight — emphasizes the medial head',
  ],
  'Single-Arm Cable Pushdown': [
    'One handle, elbow at side',
    'Extend fully and squeeze',
    'Keep the torso still',
  ],
  'EZ-Bar Overhead Triceps Extension (French Press)': [
    'Seated, bar overhead',
    'Lower behind the head, elbows pointing up',
    'Extend fully; keep the lower back supported',
  ],
  'Close-Grip Push-Up (Diamond)': [
    'Hands together under the chest',
    'Elbows back close to the ribs',
    'Body stays rigid',
  ],
  'Machine-Assisted Triceps Dip': [
    'Knees on the pad; more weight = more help',
    'Upright torso, elbows back',
    'Lower to ~90°, press to lockout',
  ],
  'Machine Overhead Triceps Extension': [
    'Seat set so elbows line up with the pivot',
    'Extend overhead fully',
    'Slow return into the stretch',
  ],
  'Skull Crusher (Dumbbell, Flat)': [
    'Neutral grip, upper arms vertical',
    'Lower the dumbbells beside the head',
    'Extend without the elbows flaring',
  ],
  'Skull Crusher (Decline, to Forehead)': [
    'Decline bench, upper arms vertical',
    'Lower to the forehead',
    'Extend fully; control the weight',
  ],
  'Close-Grip Smith Machine Bench Press': [
    'Grip about shoulder width, elbows tucked',
    'Bench placed so the bar lands on the lower chest',
    'Press to lockout',
  ],
  'Cross-Body Cable Triceps Extension': [
    'Cable from the opposite side at shoulder height',
    'Extend the arm across the body',
    'Upper arm stays fixed',
  ],
  'Resistance Band Triceps Pushdown': [
    'Band anchored high',
    'Elbows at sides, push down to lockout',
    'Squeeze at the bottom',
  ],

  // --- Forearms --------------------------------------------------------------
  'Barbell Wrist Curl (Palms Up)': [
    'Forearms on thighs or a bench, wrists hanging off',
    'Let the bar roll to the fingers, then curl up',
    'Slow and full range',
  ],
  'Barbell Wrist Extension (Palms Down)': [
    'Forearms supported, palms down',
    'Lift the back of the hands up',
    'Light weight — extensors are small',
  ],
  'Dumbbell Wrist Curl': [
    'Forearm on the bench, palm up',
    'Curl the wrist up',
    'Lower all the way',
  ],
  'Dumbbell Wrist Extension': [
    'Forearm on the bench, palm down',
    'Raise the back of the hand',
    'Control the lowering',
  ],
  'Dead Hang': [
    'Grip the bar, arms straight',
    'Shoulders slightly engaged, not fully relaxed',
    'Breathe and hold for time',
  ],
  'Behind-the-Back Barbell Wrist Curl': [
    'Stand with the bar behind you, palms back',
    'Curl the wrists up',
    'Short range; squeeze',
  ],
  'Plate Pinch Hold': [
    'Pinch two plates smooth-side out',
    'Hold at your side',
    'Stand tall; hold for time',
  ],
}
