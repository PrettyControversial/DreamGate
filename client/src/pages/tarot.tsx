import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RotateCcw, Eye, Heart, Star, Shuffle, Moon, Flame, MessageCircle, AlertTriangle, History, ChevronRight } from "lucide-react";
import tarotImage from "@assets/dreamgate_backgrounds/tarot-reading-face.webp";
import {
  consumeTarotEntrySource,
  trackDiscoverToolCompleted,
  trackEvent,
} from "@/lib/analytics";

interface TarotCard {
  id: number;
  name: string;
  arcana: "major" | "minor";
  cardSpeaks: string;
  coreMeaning: string;
  shadowAspect: string;
  dreamConnection: string;
  reflectionQuestion: string;
  reversedMeaning: string;
  keywords: string[];
}

// Image path mapping for Major Arcana cards
const getCardImagePath = (id: number, name: string): string => {
  const fileNames: Record<number, string> = {
    0: "00_THE_FOOL.jpg",
    1: "01_THE_MAGICIAN.jpg",
    2: "02_THE_HIGH_PRIESTESS.jpg",
    3: "03_THE_EMPRESS.jpg",
    4: "04_THE_EMPEROR.jpg",
    5: "05_THE_HIEROPHANT.jpg",
    6: "06_THE_LOVERS.jpg",
    7: "07_THE_CHARIOT.jpg",
    8: "08_STRENGTH.jpg",
    9: "09_THE_HERMIT.jpg",
    10: "10_WHEEL_OF_FORTUNE.jpg",
    11: "11_JUSTICE.jpg",
    12: "12_THE_HANGED_WOMAN.jpg",
    13: "13_THE_DEATH.jpg",
    14: "14_TEMPERANCE.jpg",
    15: "15_THE_DEVIL.jpg",
    16: "16_THE_TOWER.jpg",
    17: "17_THE_STAR.jpg",
    18: "18_THE_MOON.jpg",
    19: "19_THE_SUN.jpg",
    20: "20_JUDGEMENT.jpg",
    21: "21_THE_WORLD.jpg",
  };
  return `/tarot/major/${fileNames[id] || ""}`;
};

const majorArcana: TarotCard[] = [
  {
    id: 0,
    name: "The Fool",
    arcana: "major",
    cardSpeaks: "You stand at the edge of something vast and unknown. I am the breath before the leap, the trust that lets you step forward without knowing where your foot will land. Don't look down—look ahead.",
    coreMeaning: "The Fool stands at the edge of the unknown, carrying only trust and possibility. This is the eternal beginner, the part of you that knows how to leap before logic catches up. The Fool reminds you that every profound journey begins with a single step into uncertainty.",
    shadowAspect: "What part of you refuses to begin because it fears looking foolish? The Fool's shadow is the inner critic that demands guarantees before allowing you to take risks. Consider where perfectionism has kept you frozen at the cliff's edge.",
    dreamConnection: "The Fool appears in dreams as cliffs, edges, falling sensations that feel exhilarating rather than terrifying. You may dream of travel without a destination, losing your luggage and feeling freed, or being a child again with no responsibilities.",
    reflectionQuestion: "What would you begin today if you weren't afraid of failing?",
    reversedMeaning: "Your unconscious is warning against recklessness disguised as spontaneity. There may be a leap you're considering that isn't trust—it's avoidance. What are you running from rather than toward?",
    keywords: ["beginnings", "innocence", "leap of faith"]
  },
  {
    id: 1,
    name: "The Magician",
    arcana: "major",
    cardSpeaks: "Everything you need is already before you—you've simply forgotten how to see it. I am the reminder that your hands hold power, your words create reality, and your will shapes the world. Stop waiting. Begin.",
    coreMeaning: "The Magician channels the raw elements of creation—thought, passion, emotion, and matter—into manifested reality. You are being called to recognize that you already possess every tool needed to transform your circumstances. This is the archetype of conscious creation and focused will.",
    shadowAspect: "Where might you be manipulating rather than manifesting? The Magician's shadow is the trickster who uses gifts for ego rather than soul. Examine where you may be performing mastery rather than embodying it.",
    dreamConnection: "The Magician surfaces in dreams as hands performing impossible tasks, finding exactly what you need at the right moment, or discovering hidden rooms filled with tools and treasures. Dreams of speaking and being heard, of words becoming real.",
    reflectionQuestion: "What have you been waiting for permission to create?",
    reversedMeaning: "Your gifts may be scattered or misused. The psyche asks whether you're channeling your power toward what truly matters, or dispersing it in a hundred directions. Focus has been lost—or never fully claimed.",
    keywords: ["manifestation", "willpower", "creation"]
  },
  {
    id: 2,
    name: "The High Priestess",
    arcana: "major",
    cardSpeaks: "You already know the answer you seek—you've known it all along. I am the voice that speaks in silence, the knowing that arrives before words. Stop searching out there. The wisdom you need lives in the darkness behind your eyes.",
    coreMeaning: "The High Priestess guards the threshold between the seen and unseen worlds. She is the keeper of dreams, intuition, and the wisdom that cannot be spoken—only felt. When she appears, your unconscious is asking you to trust what you know before you know how you know it.",
    shadowAspect: "What are you refusing to see because the truth is inconvenient? The High Priestess's shadow is willful ignorance—the choice to override intuition with logic because knowing would require action. What whisper are you drowning out?",
    dreamConnection: "She appears as veiled women, libraries with books you cannot read, standing at doorways, or the ocean at night. Dreams of knowing things without explanation, of secrets revealed in symbolic language, of the moon in all its phases.",
    reflectionQuestion: "What do you already know that you're pretending not to know?",
    reversedMeaning: "You may be disconnected from your intuitive self, or flooded by unconscious material you haven't learned to filter. The veil has either thickened or torn—either way, the relationship with inner knowing needs tending.",
    keywords: ["intuition", "mystery", "inner knowing"]
  },
  {
    id: 3,
    name: "The Empress",
    arcana: "major",
    cardSpeaks: "Come closer. Let me hold what you've been carrying. I am the abundance that flows without effort, the creation that emerges from pleasure rather than force. You have been working so hard—when was the last time you simply received?",
    coreMeaning: "The Empress embodies the fertile, generative force of nature itself—the part of you that creates without striving. She is abundance that flows rather than grasps, beauty that exists for its own sake. When she appears, something within you is ready to be born.",
    shadowAspect: "Where might you be smothering rather than nurturing? The Empress's shadow is the devouring mother, the one who loves so fiercely that nothing can breathe. Consider whether your care for something or someone has become control.",
    dreamConnection: "The Empress manifests as gardens, pregnancy, flowers blooming in impossible places, nurturing figures, and the feeling of being held by the earth itself. Dreams of feeding, being fed, and of fertility in all its forms.",
    reflectionQuestion: "What wants to be born through you right now?",
    reversedMeaning: "Creative energy may be blocked or misdirected. You might be giving from an empty vessel, or denying yourself the pleasure and rest that would refill you. The well needs replenishing before you can nourish others.",
    keywords: ["abundance", "nurturing", "creativity"]
  },
  {
    id: 4,
    name: "The Emperor",
    arcana: "major",
    cardSpeaks: "Structure is not a cage—it is the bones that allow you to stand. I am the part of you that knows how to hold boundaries, make decisions, and create order from chaos. The question is not whether to build, but what you are building and why.",
    coreMeaning: "The Emperor is the architect of order, the one who transforms chaos into structure. He represents the part of you that can set boundaries, make decisions, and hold the container for growth. True authority comes not from dominance but from integrity.",
    shadowAspect: "Where has structure become a prison of your own making? The Emperor's shadow is the tyrant—rigid, controlling, unable to bend. Examine where you may be ruling your own life with an iron fist that leaves no room for soul.",
    dreamConnection: "The Emperor appears as father figures, thrones, castles, or the sensation of being tested by authority. Dreams of building, of being in charge but questioning whether you deserve it, of conflicts with powerful figures.",
    reflectionQuestion: "Where in your life do you need to claim your authority—or release it?",
    reversedMeaning: "Authority has become distorted—either absent when needed or overbearing when not. You may be fighting against healthy structure, or clinging to control as a substitute for genuine security. The throne is unstable.",
    keywords: ["authority", "structure", "leadership"]
  },
  {
    id: 5,
    name: "The Hierophant",
    arcana: "major",
    cardSpeaks: "There is wisdom older than you, passed down through generations of seekers. I am the bridge between what has been learned and what you must discover. Not all tradition is a trap—some paths have been walked smooth for a reason.",
    coreMeaning: "The Hierophant is the keeper of sacred tradition, the bridge between human seeking and divine wisdom. He represents teachings passed down through generations and the value of learning from those who walked the path before you. This is knowledge that has been tested by time.",
    shadowAspect: "Where might you be hiding behind doctrine to avoid direct experience? The Hierophant's shadow is dogma—rules followed without understanding, tradition wielded as a weapon against growth. Question whether your beliefs are truly yours.",
    dreamConnection: "He manifests as teachers, priests, ceremonies, or finding yourself in churches, temples, or classrooms. Dreams of receiving instruction, taking vows, or the uncomfortable feeling of being judged by standards you didn't choose.",
    reflectionQuestion: "What wisdom have you inherited that no longer serves your path?",
    reversedMeaning: "You may be called to break from tradition or find your own direct path to meaning. Alternatively, you might be rejecting valuable guidance out of rebellion rather than discernment. Not all structures are prisons.",
    keywords: ["tradition", "wisdom", "guidance"]
  },
  {
    id: 6,
    name: "The Lovers",
    arcana: "major",
    cardSpeaks: "Every choice you make reveals who you are becoming. I am not about another person—I am about you, standing at the crossroads, asked to align your outer life with your deepest values. What will you choose when no one is watching?",
    coreMeaning: "The Lovers represent far more than romance—they are the sacred moment of choosing, of aligning your actions with your deepest values. This is the integration of opposites within yourself and the recognition that every meaningful choice creates you.",
    shadowAspect: "Where are you divided against yourself? The Lovers' shadow is the split between what you want and what you think you should want. Examine where you may be living someone else's values while abandoning your own.",
    dreamConnection: "They appear as unions, wedding imagery, choosing between two paths, or standing at crossroads. Dreams of lovers both familiar and strange, of the body's wisdom, of coming together and coming apart.",
    reflectionQuestion: "What choice are you avoiding because you fear it will reveal who you really are?",
    reversedMeaning: "Misalignment has crept into your choices—your head and heart are not speaking. There may be a relationship with yourself or another that needs honest examination. What have you been pretending to want?",
    keywords: ["love", "choice", "values"]
  },
  {
    id: 7,
    name: "The Chariot",
    arcana: "major",
    cardSpeaks: "You have been pulled in opposite directions, but I am here to tell you: you do not have to choose one force over another. Harness them both. Let your will be the reins, your purpose the destination. Now—move.",
    coreMeaning: "The Chariot charges forward through sheer force of will, holding opposing forces in dynamic tension. This is not passive victory—it requires you to take the reins of conflicting impulses and direct them toward a single purpose. Movement is the only way through.",
    shadowAspect: "Where might your drive be running over something that needs gentler handling? The Chariot's shadow is the warrior who cannot stop fighting, even when the battle is over. Consider whether your momentum has become its own master.",
    dreamConnection: "The Chariot appears as vehicles, driving at great speed, racing, or the sensation of being pulled in multiple directions. Dreams of horses, cars out of control, or finally moving after being stuck.",
    reflectionQuestion: "What opposing forces within you need to be harnessed rather than resolved?",
    reversedMeaning: "The vehicle has stalled or crashed. Your will may be scattered, your direction uncertain, or you may be exerting control over the wrong things entirely. Sometimes stillness is the true victory.",
    keywords: ["victory", "determination", "willpower"]
  },
  {
    id: 8,
    name: "Strength",
    arcana: "major",
    cardSpeaks: "You have been wrestling with something—perhaps a fear, a craving, or a part of yourself you wish you could control. I am here to remind you that true power is not domination. It is the quiet hand on the lion's mane.",
    coreMeaning: "Strength is not the conquering of the beast but the taming of it through love. This is the quiet power that comes from accepting all parts of yourself—even the wild, hungry, frightening ones. True courage means approaching your own darkness with compassion.",
    shadowAspect: "Where might you be suppressing rather than integrating your instincts? Strength's shadow is false gentleness—the smile that hides the snarl, the denial of healthy aggression. Your animal self has wisdom you may be refusing.",
    dreamConnection: "Strength appears as wild animals that become gentle, facing creatures without fear, or discovering you have unexpected power. Dreams of lions, wolves, or dogs—and your relationship with them reveals your relationship with your own primal nature.",
    reflectionQuestion: "What part of yourself have you been fighting that actually needs your embrace?",
    reversedMeaning: "You may be in a power struggle with yourself—either overwhelmed by instinct or so controlled that you've lost your vital force. The lion and the maiden need each other. Neither should win.",
    keywords: ["courage", "patience", "inner strength"]
  },
  {
    id: 9,
    name: "The Hermit",
    arcana: "major",
    cardSpeaks: "The answers you seek cannot be found in the crowd. I am the lantern in the darkness, the path that only you can walk. Come away for a while. The solitude you fear is actually the sanctuary you need.",
    coreMeaning: "The Hermit walks the mountain path alone, carrying a light that serves as both guide and offering. This is the part of you that knows some journeys cannot be taken in company. Solitude is not loneliness—it is the necessary retreat that allows your own voice to be heard.",
    shadowAspect: "Where might solitude have become isolation, withdrawal a way of avoiding intimacy? The Hermit's shadow is the one who uses wisdom as a wall, who withholds light rather than sharing it. Examine whether your retreat serves growth or fear.",
    dreamConnection: "The Hermit manifests as wandering alone in nature, climbing mountains, or being in caves or on paths at night. Dreams of wise old figures, of seeking and sometimes finding, of the relief of finally being alone.",
    reflectionQuestion: "What answer are you seeking that only silence can provide?",
    reversedMeaning: "Your need for solitude may be unmet, or you may have withdrawn too far and lost your way. The light is there but not being used—either hoarded or forgotten. Connection may be the teacher now.",
    keywords: ["introspection", "solitude", "inner guidance"]
  },
  {
    id: 10,
    name: "Wheel of Fortune",
    arcana: "major",
    cardSpeaks: "Everything turns. What rises will fall; what falls will rise again. I am the reminder that your current position—whether glorious or grievous—is temporary. The question is not how to stop the wheel, but how to find your center within the turning.",
    coreMeaning: "The Wheel turns ceaselessly, carrying all things through cycles of rising and falling. This is the great pattern that underlies all change—the reminder that your current position is temporary and purposeful. What falls will rise; what rises will fall. The only constant is the turning.",
    shadowAspect: "Where are you fighting the natural rhythm of change? The Wheel's shadow is the desperate grip on a single position—whether high or low. Consider whether you're resisting a turn that's already in motion.",
    dreamConnection: "The Wheel appears as spinning objects, circular journeys, returning to places from your past, or the feeling of déjà vu. Dreams of gambling, of ups and downs, of things coming full circle.",
    reflectionQuestion: "What cycle in your life is completing, and what new one is beginning?",
    reversedMeaning: "You may be experiencing unwanted change or resisting necessary shifts. The Wheel has been fought, producing more suffering than the original turn would have caused. Sometimes surrender is the only way to right the vehicle.",
    keywords: ["fate", "cycles", "turning point"]
  },
  {
    id: 11,
    name: "Justice",
    arcana: "major",
    cardSpeaks: "I do not punish—I reveal. Every action has found its consequence, every truth its moment of disclosure. I am here to help you see clearly, to weigh what is real against what you have told yourself. Can you bear to look?",
    coreMeaning: "Justice holds the scales that weigh every action against its true measure. This is not punishment but the natural law of cause and effect—the recognition that all choices carry consequences and that truth, eventually, is revealed. She asks you to be honest, especially with yourself.",
    shadowAspect: "Where might you be judging yourself or others by standards that lack compassion? Justice's shadow is self-righteousness, the harsh internal judge that cannot forgive. Examine whether your scales are balanced or tipped by old wounds.",
    dreamConnection: "Justice appears as courts, trials, documents, or the sensation of being weighed and measured. Dreams of being accused, of defending yourself, or finally receiving recognition for what was true all along.",
    reflectionQuestion: "What truth have you been avoiding because admitting it would require change?",
    reversedMeaning: "The scales are out of balance—either through dishonesty, unfair treatment, or unintegrated guilt. Something is not being seen clearly, perhaps a pattern of either self-blame or blame-avoidance.",
    keywords: ["truth", "balance", "consequences"]
  },
  {
    id: 12,
    name: "The Hanged Man",
    arcana: "major",
    cardSpeaks: "Stop struggling. What feels like suspension is actually gestation. I am the sacred pause, the willingness to see everything from a different angle. You cannot force this—you can only allow it. Let go. Look up.",
    coreMeaning: "The Hanged Man surrenders voluntarily, choosing to see the world from an inverted perspective. This is not defeat but initiated wisdom—the recognition that some insights can only come when you stop struggling. What feels like suspension is actually incubation.",
    shadowAspect: "Where might you be mistaking paralysis for patience, or using surrender as an excuse for passivity? The Hanged Man's shadow is the martyr who suffers without purpose. Examine whether your waiting has meaning or is merely avoidance.",
    dreamConnection: "The Hanged Man appears as being stuck, suspended, upside down, or unable to move. Dreams of floating, of paralysis that is peaceful, or of seeing familiar scenes from strange angles.",
    reflectionQuestion: "What would you see differently if you stopped trying to fix it?",
    reversedMeaning: "The suspension has lasted too long, or you're resisting a necessary pause. Either struggle on when stillness is called for, or remain still when action is required. The position has lost its purpose.",
    keywords: ["surrender", "perspective", "sacred pause"]
  },
  {
    id: 13,
    name: "Death",
    arcana: "major",
    cardSpeaks: "What you are mourning has already gone. What you are gripping has already slipped away. I am not the enemy—I am the liberator. Let the dead bury the dead. Something new is stirring in the soil of what you've released.",
    coreMeaning: "Death is the great transformer, the force that clears what has completed to make room for what must emerge. This is not an ending but a threshold—the skeleton that remains when all that was temporary has fallen away. What dies is only the form; the essence continues.",
    shadowAspect: "What are you refusing to release because you've confused the container with the contents? Death's shadow is the desperate grip on what has already ended, the pretense that decay can be reversed. Consider what has been over for longer than you've admitted.",
    dreamConnection: "Death appears as endings, funerals, things decomposing, or threshold spaces like doorways and bridges. Dreams of actual death are rarely literal—they signal transformation, the need to let a version of yourself or your life die.",
    reflectionQuestion: "What part of you or your life needs to be laid to rest?",
    reversedMeaning: "Transformation is being resisted or has stagnated. You may be avoiding a necessary ending or, alternatively, rushing through grief without integration. The death is incomplete; the rebirth cannot begin.",
    keywords: ["transformation", "endings", "rebirth"]
  },
  {
    id: 14,
    name: "Temperance",
    arcana: "major",
    cardSpeaks: "You do not have to choose. I am the alchemist who blends what seems incompatible into something new. The patience you've been practicing, the small adjustments you've been making—they are working. Trust the process.",
    coreMeaning: "Temperance is the alchemist who pours between vessels, blending opposites into a third thing that transcends both. This is the art of balance that is not static but dynamic—a constant adjustment, a dance between extremes. Healing comes through integration, not elimination.",
    shadowAspect: "Where might moderation have become avoidance of depth? Temperance's shadow is the compulsive middle path that never commits to anything fully. Examine whether your balance is wisdom or fear of extremity.",
    dreamConnection: "Temperance appears as water flowing, mixing substances, alchemy, or the sensation of things coming together that shouldn't fit. Dreams of healing, of adjusting, of finding the exact right proportion.",
    reflectionQuestion: "What opposites within you are asking to be blended rather than chosen between?",
    reversedMeaning: "The balance has been lost—you may be swinging between extremes or forcing a harmony that isn't natural. Something is being over-mixed or under-integrated. The chemistry is off.",
    keywords: ["balance", "patience", "integration"]
  },
  {
    id: 15,
    name: "The Devil",
    arcana: "major",
    cardSpeaks: "Look at the chains around your neck. Look closer. They are loose enough to lift off at any moment. I am not your captor—I am your mirror, reflecting the prisons you've chosen. When you are ready to see what you've been hiding, you will be ready to leave.",
    coreMeaning: "The Devil is the chain we don't see because we've worn it so long. This is the shadow self—the parts exiled because they were unacceptable—returning in distorted form. But the chains are loose. You can leave whenever you recognize that bondage is a choice.",
    shadowAspect: "What addiction, pattern, or belief are you pretending is imposed from outside when it actually lives within? The Devil's shadow is projection—seeing your darkness everywhere except where it lives. The monster is calling from inside the house.",
    dreamConnection: "The Devil appears as being trapped, pursued, seduced, or engaging in forbidden acts. Dreams of excess, of appetite out of control, of figures that are terrifying yet strangely attractive. Shadow figures that resemble you.",
    reflectionQuestion: "What have you bound yourself to that you could walk away from today?",
    reversedMeaning: "Liberation is at hand—the chains are being recognized or removed. Alternatively, you may be in deeper denial than before, or breaking free in destructive rather than conscious ways. Freedom requires responsibility.",
    keywords: ["shadow", "bondage", "liberation"]
  },
  {
    id: 16,
    name: "The Tower",
    arcana: "major",
    cardSpeaks: "The lightning has already struck. What crumbles now was never as solid as you believed. I know this hurts—but I promise you, what remains standing after me will be true. The lies are burning. The truth is fireproof.",
    coreMeaning: "The Tower is the lightning strike that shatters the structure you built on an unstable foundation. This destruction is not punishment but revelation—the truth that was always there, suddenly undeniable. What falls needed to fall. What remains is what was real.",
    shadowAspect: "Where have you been maintaining an illusion because the truth would require you to rebuild? The Tower's shadow is the refusal to let go even as the flames rise. Examine what structure in your life was built to protect an image rather than serve your soul.",
    dreamConnection: "The Tower appears as buildings collapsing, explosions, falling from heights, or sudden chaos in familiar places. Dreams of disasters that feel strangely liberating, of the ground giving way, of escaping just in time.",
    reflectionQuestion: "What structure in your life is asking to be destroyed so something truer can be built?",
    reversedMeaning: "The collapse may be avoided or prolonged—but at what cost? You might be clinging to ruins or refusing to acknowledge that the damage is already done. Sometimes the slower fall hurts more.",
    keywords: ["upheaval", "revelation", "liberation"]
  },
  {
    id: 17,
    name: "The Star",
    arcana: "major",
    cardSpeaks: "You have survived the storm. Now rest. I am the gentle light after the great darkness, the hope that returns not because you forced it but because you are still here. Pour yourself out—there is more where that came from.",
    coreMeaning: "The Star appears after the Tower's devastation, offering the quiet promise that destruction serves renewal. She pours her water on land and sea—the conscious and unconscious—healing both. This is the hope that comes not from denial but from having survived the truth.",
    shadowAspect: "Where might false hope be preventing you from doing the work of healing? The Star's shadow is wishful thinking that avoids the harder task of integration. Examine whether your hope is grounded in action or is a refusal to grieve.",
    dreamConnection: "The Star appears as night skies, bodies of water under stars, naked vulnerability that feels safe, or being tended by gentle presences. Dreams of space, of peace after crisis, of bathing and being cleansed.",
    reflectionQuestion: "What hope remains when you stop pretending and simply feel what is true?",
    reversedMeaning: "Hope has been lost or misplaced. You may be in despair, or you may be using positivity as a shield against necessary grief. The water needs to flow somewhere—into the wound, not around it.",
    keywords: ["hope", "healing", "renewal"]
  },
  {
    id: 18,
    name: "The Moon",
    arcana: "major",
    cardSpeaks: "Welcome to the in-between place. Here, nothing is what it seems, and that is exactly as it should be. I am the territory you walk each night in dreams. Do not demand clarity—let the images speak their own language.",
    coreMeaning: "The Moon illuminates the realm between conscious and unconscious, where nothing is as it seems. This is the card of intuition, illusion, and the deep psyche—the territory you walk through every night in dreams. Trust what you feel over what you think you see.",
    shadowAspect: "What fears are you avoiding by staying in the daylight of logic? The Moon asks you to descend into uncertainty, to befriend the unknown parts of yourself that only emerge in darkness. Something in you is living only at night.",
    dreamConnection: "The Moon appears in dreams as bodies of water, nighttime journeys, animals (especially dogs or wolves), paths that shift or disappear, and feelings of being lost or enchanted. If you've dreamed of oceans, fog, or moonlit landscapes, this card is speaking directly to that.",
    reflectionQuestion: "What truth can you only access when you stop trying to figure it out?",
    reversedMeaning: "The confusion may be clearing or deepening. Illusions are being seen through—or new ones are forming. You may be receiving clarity your conscious mind doesn't yet recognize, or drowning in the unconscious without a guide.",
    keywords: ["intuition", "illusion", "the unconscious"]
  },
  {
    id: 19,
    name: "The Sun",
    arcana: "major",
    cardSpeaks: "Come out from the shadows. There is nothing to hide here, nothing to protect. I am the warmth that asks nothing of you except to receive it. For just this moment, let yourself feel the simple joy of being alive.",
    coreMeaning: "The Sun shines without effort, offering its warmth and light to all without condition. This is the archetype of pure life force, vitality, and the joy that exists when nothing is hidden. The inner child rides forward, naked and unashamed, celebrating existence itself.",
    shadowAspect: "Where might forced positivity be blinding you to complexity? The Sun's shadow is the smile that cannot allow tears, the compulsive brightness that refuses depth. Examine whether your joy is authentic or performed.",
    dreamConnection: "The Sun appears as daylight, children, gardens, warmth, and the feeling of everything being exactly right. Dreams of sunshine, of play, of returning to childhood innocence, of being seen and loved as you are.",
    reflectionQuestion: "When you strip away what you think you should feel, what joy actually wants to emerge?",
    reversedMeaning: "The light may be temporarily obscured or overwhelming. You might be blocking your own joy, or pursuing happiness in ways that bypass necessary shadow work. Even the sun sets—darkness is part of the cycle.",
    keywords: ["joy", "vitality", "authenticity"]
  },
  {
    id: 20,
    name: "Judgement",
    arcana: "major",
    cardSpeaks: "I have been calling you for some time now. Can you hear me? Something buried is ready to rise. The trumpet sounds not in condemnation but in awakening. What has been dead in you is stirring. Answer the call.",
    coreMeaning: "Judgement is the call that reaches into the depths and summons the dead to rise. This is the moment of reckoning—not as punishment but as awakening. The trumpet sounds for what has been buried, forgotten, or denied, calling it back into consciousness to be integrated at last.",
    shadowAspect: "Where might you be waiting for external absolution when the only judgement that matters is your own? Judgement's shadow is the refusal to answer the call, the half-awakening that slides back into sleep. What part of your past are you refusing to resurrect?",
    dreamConnection: "Judgement appears as calls, summons, rising from graves or water, evaluation, or the feeling of being assessed by something greater than yourself. Dreams of reunion with the dead, of hearing your name called, of waking within the dream.",
    reflectionQuestion: "What have you buried that is ready to rise?",
    reversedMeaning: "The call is being ignored or cannot be heard. Self-judgement may be too harsh or too absent. The resurrection is stalled—either by fear of what will emerge or by refusing to acknowledge that the old self has died.",
    keywords: ["awakening", "calling", "integration"]
  },
  {
    id: 21,
    name: "The World",
    arcana: "major",
    cardSpeaks: "You have arrived. Not at an ending, but at the fullness of a circle that now closes so that another may open. Take a breath. Look at how far you have come. The dance continues—but this song is complete.",
    coreMeaning: "The World is the sacred dance at the center of the mandala, the completion that holds all things in dynamic balance. This is not a static ending but a moving wholeness—you have traveled the full journey and now contain all of its lessons. A cycle completes; another is about to begin.",
    shadowAspect: "Where might completion be feared because it would require you to begin again? The World's shadow is the refusal to integrate, the endless postponement of arriving. Examine whether you're avoiding the ending because you've made the journey your identity.",
    dreamConnection: "The World appears as circles, mandalas, dancing, flying, or the sensation of everything coming together. Dreams of completion, of graduation, of returning home after long travel, of holding everything at once.",
    reflectionQuestion: "What cycle is asking to be honored as complete?",
    reversedMeaning: "Completion is near but not quite reached, or has been reached but not recognized. Something prevents the celebration—unfinished business, fear of what comes next, or failure to acknowledge how far you've come.",
    keywords: ["completion", "wholeness", "integration"]
  }
];

const spreadTypes = [
  { id: "single", name: "Single Card", description: "A message from your unconscious", cards: 1 },
  { id: "past-present-future", name: "Past, Present, Future", description: "The thread of your journey", cards: 3 },
  { id: "dream", name: "Dream Insight", description: "Illuminate your dream's hidden depths", cards: 3 },
];

interface TarotReading {
  id: string;
  date: string;
  spreadType: string;
  cards: { cardId: number; cardName: string; reversed: boolean; position: string }[];
}

function getReadingHistory(): TarotReading[] {
  try {
    const data = localStorage.getItem('tarot_history');
    if (data) return JSON.parse(data);
  } catch {}
  return [];
}

function saveReading(reading: TarotReading) {
  const history = getReadingHistory();
  history.unshift(reading);
  const trimmed = history.slice(0, 10);
  localStorage.setItem('tarot_history', JSON.stringify(trimmed));
  
  const count = parseInt(localStorage.getItem('tarotReadings') || '0');
  localStorage.setItem('tarotReadings', String(count + 1));
}

export default function Tarot() {
  const [selectedSpread, setSelectedSpread] = useState<string | null>(null);
  const [drawnCards, setDrawnCards] = useState<{ card: TarotCard; reversed: boolean; position: string }[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [readingHistory, setReadingHistory] = useState<TarotReading[]>([]);

  useEffect(() => {
    const entry = consumeTarotEntrySource();
    trackEvent("tarot_opened", entry);
    setReadingHistory(getReadingHistory());
  }, []);

  const shuffleAndDraw = (spreadId: string) => {
    const spread = spreadTypes.find(s => s.id === spreadId);
    if (!spread) return;

    setSelectedSpread(spreadId);
    setIsRevealing(true);
    setRevealedCount(0);
    
    const shuffled = [...majorArcana].sort(() => Math.random() - 0.5);
    const positions = spreadId === "single" 
      ? ["Your Message"]
      : spreadId === "past-present-future"
      ? ["Past", "Present", "Future"]
      : ["The Symbol", "The Shadow", "The Guidance"];
    
    const drawn = shuffled.slice(0, spread.cards).map((card, index) => ({
      card,
      reversed: Math.random() > 0.7,
      position: positions[index]
    }));

    setDrawnCards(drawn);

    const reading: TarotReading = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      spreadType: spreadId,
      cards: drawn.map(d => ({
        cardId: d.card.id,
        cardName: d.card.name,
        reversed: d.reversed,
        position: d.position
      }))
    };
    saveReading(reading);
    trackEvent("tarot_card_drawn", {
      spread: spreadId,
      card_count: drawn.length,
      reversed_count: drawn.filter((card) => card.reversed).length,
      tool_id: "tarot",
    });
    trackDiscoverToolCompleted(["tarot", "tarot-101"], "card_drawn");
    setReadingHistory(getReadingHistory());

    drawn.forEach((_, index) => {
      setTimeout(() => {
        setRevealedCount(prev => prev + 1);
        if (index === drawn.length - 1) {
          setTimeout(() => setIsRevealing(false), 500);
        }
      }, (index + 1) * 800);
    });
  };

  const resetReading = () => {
    setSelectedSpread(null);
    setDrawnCards([]);
    setRevealedCount(0);
    setIsRevealing(false);
  };

  const getCardSymbol = (card: TarotCard): string => {
    const symbols: Record<number, string> = {
      0: "0", 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII",
      8: "VIII", 9: "IX", 10: "X", 11: "XI", 12: "XII", 13: "XIII", 14: "XIV",
      15: "XV", 16: "XVI", 17: "XVII", 18: "XVIII", 19: "XIX", 20: "XX", 21: "XXI"
    };
    return symbols[card.id] || "0";
  };

  const generateReadingSummary = (): string => {
    if (drawnCards.length === 0) return "";

    if (selectedSpread === "single") {
      const { card, reversed } = drawnCards[0];
      if (reversed) {
        return `${card.name} appears reversed, asking you to look within. ${card.reversedMeaning} This is not a warning but an invitation—your unconscious is surfacing material that needs your attention. Consider this reflection: ${card.reflectionQuestion}`;
      }
      return `${card.name} emerges to speak with you today. ${card.coreMeaning.split('.')[0]}. Your psyche is illuminating themes of ${card.keywords.join(', ')}. ${card.reflectionQuestion}`;
    }

    if (selectedSpread === "past-present-future") {
      const [past, present, future] = drawnCards;
      return `Your journey unfolds through three thresholds. In the past, ${past.card.name}${past.reversed ? ' (reversed)' : ''} shaped your foundation—${past.reversed ? past.card.shadowAspect.split('.')[0] : past.card.coreMeaning.split('.')[0]}. The present holds ${present.card.name}${present.reversed ? ' (reversed)' : ''}, speaking to where you stand now: ${present.reversed ? present.card.shadowAspect.split('.')[0] : present.card.coreMeaning.split('.')[0]}. Ahead, ${future.card.name}${future.reversed ? ' (reversed)' : ''} illuminates the path forward—${future.reversed ? future.card.shadowAspect.split('.')[0] : future.card.coreMeaning.split('.')[0]}. The thread connecting these archetypes is asking: what patterns are you ready to see?`;
    }

    const [symbol, shadow, guidance] = drawnCards;
    return `Your dream speaks through ${symbol.card.name}${symbol.reversed ? ' (reversed)' : ''} as its central symbol—${symbol.card.dreamConnection.split('.')[0]}. The shadow material surfacing is revealed through ${shadow.card.name}${shadow.reversed ? ' (reversed)' : ''}: ${shadow.card.shadowAspect.split('.')[0]}. For guidance, ${guidance.card.name}${guidance.reversed ? ' (reversed)' : ''} offers this wisdom: ${guidance.reversed ? guidance.card.reversedMeaning.split('.')[0] : guidance.card.coreMeaning.split('.')[0]}. Your dreaming mind has woven these archetypes together—what message emerges from their intersection?`;
  };

  const isSingleCard = selectedSpread === "single" && drawnCards.length === 1;

  return (
    <div className={`pb-24${selectedSpread ? " tarot-reading-active" : ""}`}>
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 mb-8 -mx-6 md:-mx-8 -mt-6 md:-mt-8 overflow-hidden">
        <img 
          src={tarotImage} 
          alt="Mystical tarot cards" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="text-xs uppercase tracking-[0.2em] text-foreground/70 drop-shadow-md">Divine Guidance</p>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight text-foreground drop-shadow-lg mt-2" data-testid="text-tarot-title">
            Tarot Reading
          </h1>
          <p className="text-foreground/80 mt-3 max-w-md drop-shadow-md">
            Archetypal guidance from the Major Arcana
          </p>
        </div>
      </div>

      <div className="px-6 md:px-8 max-w-4xl mx-auto space-y-8">
        {!selectedSpread ? (
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-muted-foreground" />
                  Choose Your Reading
                </CardTitle>
                <CardDescription>
                  Select a spread to receive guidance from the Major Arcana
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-foreground/90">
                  The 22 cards of the Major Arcana represent the great archetypal forces that shape human experience—
                  from the innocent Fool to the integrated World. Each card speaks in the symbolic language of 
                  your dreams, offering not fortune-telling but a mirror for self-reflection.
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {spreadTypes.map((spread) => (
                <Card
                  key={spread.id}
                  className="cursor-pointer hover-elevate overflow-visible transition-all border-border hover:border-primary/50"
                  onClick={() => shuffleAndDraw(spread.id)}
                  data-testid={`card-spread-${spread.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline">{spread.cards} card{spread.cards > 1 ? 's' : ''}</Badge>
                      <Shuffle className="h-4 w-4 text-foreground/60" />
                    </div>
                    <h3 className="font-display text-lg font-semibold mb-1 text-foreground">{spread.name}</h3>
                    <p className="text-sm text-foreground/80">{spread.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {readingHistory.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <History className="h-5 w-5 text-muted-foreground" />
                    Recent Readings
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-muted-foreground"
                    data-testid="button-toggle-history"
                  >
                    {showHistory ? "Hide" : "Show All"}
                    <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${showHistory ? "rotate-90" : ""}`} />
                  </Button>
                </CardHeader>
                {showHistory && (
                  <CardContent className="space-y-3">
                    {readingHistory.map((reading) => (
                      <div 
                        key={reading.id}
                        className="p-4 rounded-xl bg-muted/30 border border-border"
                        data-testid={`reading-history-${reading.id}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {spreadTypes.find(s => s.id === reading.spreadType)?.name}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(reading.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {reading.cards.map((card, idx) => (
                            <Badge 
                              key={idx} 
                              variant="secondary"
                              className={`text-xs ${card.reversed ? "bg-destructive/20 text-destructive" : ""}`}
                            >
                              {card.cardName} {card.reversed ? "(R)" : ""}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            )}

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Moon className="h-5 w-5 text-muted-foreground" />
                  Tarot & The Dreaming Mind
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-foreground/90">
                <p>
                  The Major Arcana speak the same symbolic language as your dreams—both emerge from the depths of 
                  the unconscious, using archetypal imagery to communicate what words cannot capture. When you draw 
                  a card, you're not predicting the future—you're having a conversation with your own depths.
                </p>
                <p>
                  Use the "Dream Insight" spread after recording a significant dream. The cards won't tell you 
                  what your dream means—they'll help you feel your way toward meaning, the way your dreaming 
                  mind intended all along.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-foreground">
                {spreadTypes.find(s => s.id === selectedSpread)?.name}
              </h2>
              <Button variant="outline" size="sm" onClick={resetReading} data-testid="button-new-reading">
                <RotateCcw className="h-4 w-4 mr-2" />
                New Reading
              </Button>
            </div>

            {/* Single Card - Enhanced Centered Layout */}
            {isSingleCard && revealedCount > 0 ? (
              <div className="flex flex-col items-center text-center space-y-6">
                {drawnCards.map((drawn, index) => (
                  <div
                    key={index}
                    className={`w-full max-w-2xl transition-all duration-500 ${
                      index < revealedCount ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                    data-testid={`card-drawn-${index}`}
                  >
                    {/* Position Badge */}
                    <div className="flex justify-center mb-4">
                      <Badge className="bg-primary/20 text-muted-foreground border-primary/30">
                        {drawn.position}
                      </Badge>
                    </div>

                    {/* Larger Card Image with 3D Flip - Centered */}
                    <div className="flex justify-center mb-5">
                      <div className="tarot-card-container w-40 h-64 sm:w-44 sm:h-72 md:w-48 md:h-80">
                        <div className={`tarot-card w-full h-full ${index < revealedCount ? 'animate-card-flip' : ''}`}>
                          <div className="tarot-card-face tarot-card-back rounded-xl overflow-hidden shadow-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/40 to-secondary/40 flex items-center justify-center">
                            <Sparkles className="h-16 w-16 text-muted-foreground/60" />
                          </div>
                          <div className={`tarot-card-face tarot-card-front rounded-xl overflow-hidden shadow-2xl border-2 border-primary/30 ${drawn.reversed ? 'rotate-180' : ''}`}>
                            <img 
                              src={getCardImagePath(drawn.card.id, drawn.card.name)} 
                              alt={drawn.card.name}
                              className="w-full h-full object-contain bg-muted/20"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden absolute inset-0 bg-gradient-to-b from-primary/30 to-primary/10 items-center justify-center">
                              <span className="font-display text-5xl font-bold text-muted-foreground">
                                {getCardSymbol(drawn.card)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Name & Status */}
                    <h3 className="font-display text-2xl font-bold mb-2 text-foreground">{drawn.card.name}</h3>
                    {drawn.reversed && (
                      <Badge variant="outline" className="text-destructive border-destructive/50 mb-4">Reversed</Badge>
                    )}

                    {/* Keywords */}
                    <div className="flex flex-wrap justify-center gap-2 mb-8">
                      {drawn.card.keywords.map((keyword) => (
                        <Badge key={keyword} variant="outline" className="text-sm capitalize">
                          {keyword}
                        </Badge>
                      ))}
                    </div>

                    {/* The Card Speaks - Poetic Voice */}
                    <div className="space-y-3 mb-8 px-4">
                      <h4 className="text-sm font-medium flex items-center justify-center gap-2 text-muted-foreground">
                        <MessageCircle className="h-4 w-4" />
                        The Card Speaks
                      </h4>
                      <p className="text-lg italic leading-relaxed text-foreground">
                        "{drawn.card.cardSpeaks}"
                      </p>
                    </div>

                    {/* Core Meaning */}
                    <div className="tarot-reading-contrast space-y-3 mb-8 px-4">
                      <h4 className="text-sm font-medium flex items-center justify-center gap-2 text-secondary">
                        <Flame className="h-4 w-4" />
                        Core Meaning
                      </h4>
                      <p className="text-foreground/90 leading-relaxed">
                        {drawn.card.coreMeaning}
                      </p>
                    </div>

                    {/* Shadow Aspect */}
                    <div className="tarot-reading-contrast space-y-3 mb-8 px-4">
                      <h4 className="text-sm font-medium flex items-center justify-center gap-2 text-secondary">
                        <Eye className="h-4 w-4" />
                        Shadow Aspect
                      </h4>
                      <p className="text-foreground/90 leading-relaxed">
                        {drawn.card.shadowAspect}
                      </p>
                    </div>

                    {/* Dream Connection */}
                    <div className="tarot-reading-contrast space-y-3 mb-8 px-4">
                      <h4 className="text-sm font-medium flex items-center justify-center gap-2 text-secondary">
                        <Moon className="h-4 w-4" />
                        Dream Connection
                      </h4>
                      <p className="text-foreground/90 leading-relaxed">
                        {drawn.card.dreamConnection}
                      </p>
                    </div>

                    {/* Reflection Prompt */}
                    <div className="space-y-3 mb-8 px-4 py-6 rounded-lg bg-primary/5 border border-primary/20">
                      <h4 className="text-sm font-medium flex items-center justify-center gap-2 text-muted-foreground">
                        <Heart className="h-4 w-4" />
                        For Reflection
                      </h4>
                      <p className="text-lg italic text-foreground">
                        "{drawn.card.reflectionQuestion}"
                      </p>
                    </div>

                    {/* If Reversed Section */}
                    {drawn.reversed && (
                      <div className="space-y-3 px-4 py-6 rounded-lg bg-destructive/5 border border-destructive/20">
                        <h4 className="text-sm font-medium flex items-center justify-center gap-2 text-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          Reversed Position
                        </h4>
                        <p className="text-foreground/90 leading-relaxed">
                          {drawn.card.reversedMeaning}
                        </p>
                      </div>
                    )}

                    {/* Upright - Show Reversed Meaning as Additional Context */}
                    {!drawn.reversed && (
                      <div className="space-y-3 px-4 py-6 rounded-lg bg-muted/30 border border-border">
                        <h4 className="text-sm font-medium flex items-center justify-center gap-2 text-foreground/70">
                          <AlertTriangle className="h-4 w-4" />
                          If This Card Were Reversed
                        </h4>
                        <p className="text-foreground/60 text-sm leading-relaxed">
                          {drawn.card.reversedMeaning}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Multi-Card Layout (3 cards) */
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {drawnCards.map((drawn, index) => (
                  <div
                    key={index}
                    className={`transition-all duration-500 ${
                      index < revealedCount ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                    data-testid={`card-drawn-${index}`}
                  >
                    <Card className="overflow-hidden border-border">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <Badge className="bg-primary/20 text-muted-foreground border-primary/30">
                            {drawn.position}
                          </Badge>
                          {drawn.reversed && (
                            <Badge variant="outline" className="text-destructive border-destructive/50">Reversed</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-col items-center gap-4">
                          <div className="tarot-card-container w-32 h-52 sm:w-36 sm:h-60 md:w-40 md:h-64">
                            <div className={`tarot-card w-full h-full ${index < revealedCount ? 'animate-card-flip' : ''}`} style={{ animationDelay: `${index * 300}ms` }}>
                              <div className="tarot-card-face tarot-card-back rounded-lg overflow-hidden shadow-lg border-2 border-primary/30 bg-gradient-to-br from-primary/40 to-secondary/40 flex items-center justify-center">
                                <Sparkles className="h-12 w-12 text-muted-foreground/60" />
                              </div>
                              <div className={`tarot-card-face tarot-card-front rounded-lg overflow-hidden shadow-lg border-2 border-primary/30 ${drawn.reversed ? 'rotate-180' : ''}`}>
                                <img 
                                  src={getCardImagePath(drawn.card.id, drawn.card.name)} 
                                  alt={drawn.card.name}
                                  className="w-full h-full object-contain bg-muted/20"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                                <div className="hidden absolute inset-0 bg-gradient-to-b from-primary/30 to-primary/10 items-center justify-center">
                                  <span className="font-display text-4xl font-bold text-muted-foreground">
                                    {getCardSymbol(drawn.card)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <h3 className="font-display text-xl font-semibold text-foreground">{drawn.card.name}</h3>
                            <div className="flex flex-wrap justify-center gap-1 mt-2">
                              {drawn.card.keywords.map((keyword) => (
                                <Badge key={keyword} variant="outline" className="text-xs capitalize">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="tarot-reading-contrast">
                            <p className="text-sm font-medium flex items-center gap-1 mb-2 text-foreground">
                              <Flame className="h-3 w-3 text-muted-foreground" />
                              {drawn.reversed ? "Shadow & Reversal" : "Core Meaning"}
                            </p>
                            <p className="text-sm text-foreground/90 leading-relaxed">
                              {drawn.reversed ? drawn.card.reversedMeaning : drawn.card.coreMeaning}
                            </p>
                          </div>

                          <div className="tarot-reading-contrast">
                            <p className="text-sm font-medium flex items-center gap-1 mb-2 text-foreground">
                              <Moon className="h-3 w-3 text-muted-foreground" />
                              Dream Connection
                            </p>
                            <p className="text-sm text-foreground/90 leading-relaxed">
                              {drawn.card.dreamConnection}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-border">
                            <p className="text-sm font-medium flex items-center gap-1 mb-2 text-foreground">
                              <Heart className="h-3 w-3 text-muted-foreground" />
                              For Reflection
                            </p>
                            <p className="text-sm italic text-foreground/90">
                              "{drawn.card.reflectionQuestion}"
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}

            {!isRevealing && drawnCards.length > 0 && !isSingleCard && (
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                    Your Reading
                  </h3>
                  <p className="text-foreground/90 leading-relaxed">
                    {generateReadingSummary()}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
