/** Form cues — legs, glutes, core. Keyed by exact catalog name. */
export const LOWER_CUES: Record<string, string[]> = {
  // --- Legs ------------------------------------------------------------------
  'Barbell Back Squat': [
    'Bar on the upper back, brace before you descend',
    'Knees track over toes; sit between your heels',
    'Hit depth, then drive up with chest and hips together',
  ],
  'Barbell Front Squat': [
    'Bar on the front delts, elbows high',
    'Stay upright; sit straight down',
    "Don't let the elbows drop out of the bottom",
  ],
  'Goblet Squat': [
    'Hold the weight at your chest, elbows down',
    'Sit down between your knees, chest tall',
    'Push the knees out at the bottom',
  ],
  'Leg Press': [
    'Feet shoulder-width, mid-platform',
    'Lower until knees are ~90° without the lower back rounding',
    "Press through the whole foot; don't lock out hard",
  ],
  'Hack Squat (Machine)': [
    'Back flat on the pad, feet shoulder-width',
    'Descend deep with control',
    'Drive through mid-foot',
  ],
  'Leg Extension': [
    'Knee lined up with the machine pivot',
    'Extend fully and squeeze the quads',
    'Slow on the way down',
  ],
  'Walking Lunge (Dumbbell)': [
    'Long step, torso upright',
    'Back knee drops toward the floor',
    'Drive through the front heel into the next step',
  ],
  'Bulgarian Split Squat': [
    'Rear foot on a bench, front foot far enough forward',
    'Drop straight down, front knee over the foot',
    'Slight forward lean = more glute; upright = more quad',
  ],
  'Sumo Squat (Dumbbell)': [
    'Wide stance, toes turned out',
    'Hold the dumbbell hanging between the legs',
    'Sit straight down, knees tracking out',
  ],
  'Barbell Romanian Deadlift': [
    'Soft knees, push the hips back',
    'Bar slides down the thighs, back flat',
    'Stop at a hamstring stretch, then drive the hips forward',
  ],
  'Dumbbell Romanian Deadlift': [
    'Dumbbells in front of the thighs',
    'Hinge at the hips with a flat back',
    'Feel the hamstrings stretch; stand up with glutes',
  ],
  'Lying Leg Curl (Machine)': [
    'Knees just off the pad edge, hips pressed down',
    'Curl the heels toward the glutes',
    'Slow lowering',
  ],
  'Seated Leg Curl (Machine)': [
    'Knee lined up with the pivot, thigh pad snug',
    'Curl down fully',
    'Control the return',
  ],
  'Good Morning (Barbell)': [
    'Bar on the upper back, soft knees',
    'Hinge forward with a flat back',
    'Go only as far as the hamstrings allow; start light',
  ],
  'Nordic Hamstring Curl': [
    'Heels anchored, kneel upright',
    'Lower forward as slowly as possible',
    'Catch with the hands; pull back or push up',
  ],
  'Standing Calf Raise (Machine)': [
    'Balls of the feet on the edge',
    'Full stretch at the bottom, pause',
    'Rise as high as possible; no bouncing',
  ],
  'Seated Calf Raise (Machine)': [
    'Pad on the lower thighs',
    'Deep stretch at the bottom',
    'Rise high; targets the soleus',
  ],
  'Donkey Calf Raise': [
    'Hinged forward, balls of feet on a step',
    'Full stretch, full rise',
    'Pause at both ends',
  ],
  'Cable Hip Adduction': [
    'Ankle strap on the inside leg',
    'Sweep the leg across the body',
    'Stand tall, hold something for balance',
  ],
  'Cable Hip Abduction': [
    'Ankle strap on the outside leg',
    'Sweep the leg out to the side',
    "Don't lean the torso — keep it small and controlled",
  ],
  'Sissy Squat': [
    'Hold a support, rise onto the toes',
    'Lean back as the knees travel forward',
    'Lower only as far as you control',
  ],
  'Pistol Squat': [
    'One leg extended in front',
    'Sit down on the standing leg',
    'Use a box or support to learn it',
  ],
  'Belt Squat': [
    'Belt around the hips, feet on the platform',
    'Squat down with an upright torso',
    'Leg work with no spinal loading',
  ],
  'Smith Machine Squat': [
    'Feet slightly forward of the bar',
    'Sit down with control',
    'Drive up through the mid-foot',
  ],
  'Single-Leg Press (Machine)': [
    'One foot centered on the platform',
    'Lower with control',
    'Keep the hips level',
  ],
  'Lateral Lunge (Dumbbell)': [
    'Big step to the side',
    'Sit back into the stepping hip, other leg straight',
    'Push back to center',
  ],
  'Stiff-Leg Deadlift (Barbell)': [
    'Knees nearly straight',
    'Hinge with a flat back',
    'Big hamstring stretch; lighter than an RDL',
  ],
  'Glute-Ham Raise': [
    'Knees just behind the pad, feet locked in',
    'Lower the torso forward',
    'Pull up with hamstrings and glutes',
  ],
  'Standing Leg Curl (Machine)': [
    'One leg at a time, hips against the pad',
    'Curl the heel up',
    'Slow lowering',
  ],
  'Calf Press (Leg Press Machine)': [
    'Balls of the feet on the bottom edge',
    'Knees straight but not locked',
    'Full stretch and full press',
  ],
  'Single-Leg Calf Raise (Dumbbell)': [
    'Stand on a step on one foot',
    'Full stretch at the bottom',
    'Rise as high as possible',
  ],
  'Hip Adduction Machine (Seated)': [
    'Pads on the inner knees',
    'Squeeze the legs together',
    'Slow return to the stretch',
  ],
  'Hip Abduction Machine (Seated)': [
    'Pads on the outer knees',
    'Push the legs apart',
    'Lean slightly forward for more glute',
  ],
  'Copenhagen Plank': [
    'Top leg on a bench, side plank position',
    'Lift the hips off the floor',
    'Hold; the inner thigh does the work',
  ],
  'Single-Leg Romanian Deadlift (Dumbbell)': [
    'Soft knee on the standing leg',
    'Hinge forward, back leg rising behind you',
    'Keep the hips square to the floor',
  ],
  'Reverse Nordic Curl': [
    'Kneel upright, hips straight',
    'Lean back as one line from knees to head',
    'Only as far as you can pull back up',
  ],
  'Box Squat (Barbell)': [
    'Sit back to a box at depth',
    'Pause briefly without relaxing',
    'Drive up explosively',
  ],
  'Dumbbell Step-Down': [
    'Stand on a box, lower the other foot slowly',
    'Knee tracks over the toes',
    'Tap the heel and return',
  ],
  'Wall Sit': [
    'Back flat against the wall',
    'Thighs parallel to the floor',
    'Hold for time',
  ],
  'Tibialis Raise': [
    'Lean back against a wall, heels forward',
    'Lift the toes up toward the shins',
    'Slow lowering',
  ],

  // --- Glutes ----------------------------------------------------------------
  'Barbell Hip Thrust': [
    'Upper back on the bench edge, bar in the hip crease',
    'Chin tucked, ribs down',
    'Drive through the heels; squeeze glutes at the top',
  ],
  'Barbell Glute Bridge': [
    'Lie on the floor, bar across the hips',
    'Drive the hips up through the heels',
    'Pause and squeeze at the top',
  ],
  'Smith Machine Hip Thrust': [
    'Same setup as a barbell hip thrust',
    'Bar path is fixed — focus on the squeeze',
    'Full lockout at the top',
  ],
  'Single-Leg Glute Bridge': [
    'One foot planted, other leg extended',
    'Drive the hips up evenly',
    "Don't let the pelvis tilt",
  ],
  'Cable Glute Kickback': [
    'Ankle strap, slight hinge forward',
    'Kick the leg straight back',
    "Squeeze the glute; don't arch the lower back",
  ],
  'Banded Lateral Walk': [
    'Band above knees or at ankles, quarter squat',
    'Step sideways, keep tension',
    "Toes forward; don't let the feet come together",
  ],
  'Fire Hydrant (Bodyweight)': [
    'Hands and knees',
    'Lift one knee out to the side',
    'Keep the torso still',
  ],
  'Curtsy Lunge': [
    'Step one leg behind and across',
    'Lower with control',
    'Drive back up through the front heel',
  ],
  'Step-Up (Dumbbell)': [
    'Whole foot on the box',
    'Drive up through the top leg — minimal push from the back foot',
    'Control the step down',
  ],
  'Frog Pump': [
    'Soles of the feet together, knees out',
    'Pump the hips up',
    'High reps, squeeze at the top',
  ],
  'Reverse Hyperextension': [
    'Hips on the pad edge',
    'Raise the legs with the glutes',
    'Control the swing down',
  ],
  'Cable Pull-Through': [
    'Face away from a low pulley, rope between the legs',
    'Hinge back, then thrust the hips forward',
    'Arms are just hooks — hips do the work',
  ],
  'Seated Hip Abduction Machine': [
    'Pads on the outer knees',
    'Push out and hold briefly',
    'Controlled return',
  ],
  'Cable Standing Hip Abduction': [
    'Ankle strap on the far leg',
    'Sweep out to the side',
    'Stand tall; small controlled range',
  ],
  'Banded Clamshell': [
    'Lie on your side, knees bent, band above knees',
    'Open the top knee, feet together',
    "Don't roll the hips back",
  ],
  'Donkey Kick (Bodyweight)': [
    'Hands and knees',
    'Kick one heel up toward the ceiling',
    'Squeeze the glute; keep the back flat',
  ],
  '45-Degree Hyperextension (Glute-Focused)': [
    'Pad below the hip crease, feet turned out',
    'Round the upper back slightly',
    'Drive up with the glutes',
  ],
  'Kettlebell Swing': [
    'Hike the bell back between the legs',
    'Snap the hips forward to float it to chest height',
    "It's a hinge, not a squat — arms stay loose",
  ],
  'Single-Leg Hip Thrust (Bodyweight)': [
    'Upper back on a bench, one foot planted',
    'Drive up through the heel',
    'Keep the hips level',
  ],
  'B-Stance Hip Thrust': [
    'One foot slightly ahead, most weight on the back leg',
    'Drive up through the working heel',
    'Squeeze at the top',
  ],
  'Hip Thrust Machine (Plate-Loaded)': [
    'Pad across the hips, upper back supported',
    'Drive up to full hip extension',
    'Pause and squeeze',
  ],
  'Standing Glute Kickback Machine': [
    'Chest on the pad, foot on the platform',
    'Push back and up',
    'Squeeze; avoid arching the back',
  ],
  'Banded Hip Thrust': [
    'Band across the hips, anchored at the floor',
    'Drive up through the heels',
    'Hold the top — band tension peaks there',
  ],

  // --- Core ------------------------------------------------------------------
  'Crunch (Floor)': [
    'Knees bent, hands lightly by the head',
    'Curl the ribs toward the pelvis',
    "Don't pull on the neck",
  ],
  'Cable Crunch (Kneeling)': [
    'Kneel with the rope by your head',
    'Curl the torso down, ribs to hips',
    'Hips stay still — it is not a hinge',
  ],
  'Machine Crunch': [
    'Adjust so the pads sit on the chest',
    'Curl forward',
    'Slow return',
  ],
  'Weighted Sit-Up': [
    'Hold a plate at the chest',
    'Sit all the way up',
    'Control the lowering',
  ],
  'Hanging Leg Raise': [
    'Dead hang, shoulders engaged',
    'Raise the legs, curling the pelvis up at the top',
    'No swinging — lower slowly',
  ],
  'Hanging Knee Raise': [
    'Dead hang',
    'Bring the knees up toward the chest',
    'Curl the pelvis; control the lowering',
  ],
  'Reverse Crunch': [
    'Lie on your back, knees bent up',
    'Curl the hips off the floor',
    'Slow and controlled; no momentum',
  ],
  "Captain's Chair Leg Raise": [
    'Back against the pad, forearms supported',
    'Raise the knees or legs',
    'Curl the pelvis up at the top',
  ],
  'Plank (Forearm)': [
    'Elbows under the shoulders, body straight',
    'Squeeze glutes and brace',
    "Don't let the hips sag or pike",
  ],
  'Side Plank': [
    'Elbow under the shoulder, feet stacked',
    'Hips high in a straight line',
    'Hold, then switch sides',
  ],
  'Cable Woodchopper (High-to-Low)': [
    'Cable high, rotate through the torso',
    'Pull down and across to the opposite hip',
    'Pivot the back foot',
  ],
  'Cable Woodchopper (Low-to-High)': [
    'Cable low, start by the hip',
    'Rotate and lift across the body',
    'Arms stay mostly straight',
  ],
  'Russian Twist': [
    'Lean back slightly, feet up or down',
    'Rotate the shoulders side to side',
    'Move the chest, not just the arms',
  ],
  'Hanging Windshield Wipers': [
    'Hang with legs raised to vertical',
    'Rotate the legs side to side',
    'Advanced — control every inch',
  ],
  'Pallof Press': [
    'Stand side-on to the cable, handle at the chest',
    'Press straight out and resist the rotation',
    'Hold briefly at full extension',
  ],
  'Ab Wheel Rollout': [
    'Kneel, hands on the wheel',
    'Roll out keeping the ribs down',
    "Don't let the lower back sag; pull back with the abs",
  ],
  'Dead Bug': [
    'On your back, arms up, knees at 90°',
    'Lower opposite arm and leg slowly',
    'Lower back stays pressed into the floor',
  ],
  'V-Up': [
    'Lie flat, arms overhead',
    'Lift the legs and torso to meet in a V',
    'Control the way down',
  ],
  'Sit-Up': [
    'Knees bent, feet flat',
    'Curl up to sitting',
    'Lower with control',
  ],
  'Bicycle Crunch': [
    'Hands by the head, legs raised',
    'Bring elbow toward the opposite knee',
    'Slow rotation beats fast pedaling',
  ],
  'Flutter Kicks': [
    'Lie flat, legs raised slightly',
    'Small alternating kicks',
    'Lower back pressed down',
  ],
  'Toes-to-Bar': [
    'Dead hang',
    'Swing the toes up to touch the bar',
    'Control the descent',
  ],
  'Mountain Climber': [
    'High plank position',
    'Drive the knees toward the chest alternately',
    'Keep the hips level',
  ],
  'Bird Dog': [
    'Hands and knees, flat back',
    'Extend opposite arm and leg',
    'Hold briefly; hips stay square',
  ],
  'Hollow Body Hold': [
    'Lower back pressed into the floor',
    'Arms and legs extended just off the floor',
    'Hold; bend the knees to make it easier',
  ],
  'Suitcase Carry': [
    'Heavy weight in one hand',
    'Walk tall without leaning',
    'Switch sides',
  ],
  'Landmine 180 (Rotation)': [
    'Hold the bar end at arm length overhead',
    'Rotate it side to side in an arc',
    'Pivot the feet; move from the torso',
  ],
  'Decline Sit-Up': [
    'Feet locked in on a decline bench',
    'Sit up with control',
    'Lower slowly',
  ],
  'Stir-the-Pot (Stability Ball Plank)': [
    'Forearms on a stability ball, plank position',
    'Draw small circles with the forearms',
    'Keep the body rigid',
  ],
  'Dragon Flag': [
    'Lie on a bench, grab behind the head',
    'Lift the body straight from the shoulders',
    'Lower slowly — advanced',
  ],
  'L-Sit': [
    'Hands on parallettes or a bench',
    'Lift the legs straight out in front',
    'Hold; tuck the knees to make it easier',
  ],
  'Plank with Shoulder Tap': [
    'High plank, feet wide',
    'Tap each shoulder with the opposite hand',
    'Keep the hips still',
  ],
}
