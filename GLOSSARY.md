# LunaBirth

A labour-support companion for the person giving birth and their birth partner: preparing during pregnancy, then timing contractions, hydrating and coping with pain during labour.

## Modes

**Expectation mode**:
The pre-labour state of the app, focused on the due-date countdown and preparation tasks.
_Avoid_: Expecting mode, pregnancy mode

**Labour mode**:
The state of the app while labour is under way, focused on contractions, hydration and pain relief.
_Avoid_: Labor mode, birth mode

## Contractions

**Contraction**:
One timed tightening, recorded by its start moment and its duration.

**Gap**:
The time from the start of one contraction to the start of the next.
_Avoid_: Interval, frequency, spacing

**Contraction series**:
The unbroken run of the most recent contractions, with no gap longer than 60 minutes; an earlier run (such as a false alarm) is not part of it.
_Avoid_: Session, episode, labour run

**Phase**:
The stage of labour suggested by the current contraction series: tracking, early, active or transition.
_Avoid_: Stage

**Contraction rule**:
A provider-advised threshold (5-1-1, 4-1-1 or 3-1-1) for when to contact the birth team; met when the latest contractions of the current series are on average at most X minutes apart and about one minute long.
_Avoid_: 5-1-1 rule (when meaning the configurable rule in general), hospital alert

## People

**Primary**:
The person giving birth, who owns the shared data.
_Avoid_: Owner, mother, user

**Partner**:
A support person who follows the primary's data on their own device.
_Avoid_: Birth partner (in code), guest, viewer

**Labour contact**:
A person the primary or partner may need to call during labour, kept as a nickname and phone number.
_Avoid_: Emergency contact
