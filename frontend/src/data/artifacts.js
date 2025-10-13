import bamboobow from "/assets/artifacts/Bamboo-Bow.jpg";
import stoneArrowPoints from "/assets/artifacts/stone-arrow-points.webp";
import axe from "/assets/artifacts/axe.webp";
import clayPot from "/assets/artifacts/clay-pot.webp";
import honeyCollectingVessel from "/assets/artifacts/honey-collecting-vessel.webp";
import barkCloth from "/assets/artifacts/bark-cloth.webp";
import shellNecklace from "/assets/artifacts/shell-necklace.webp";
import boneOrnaments from "/assets/artifacts/bone-ornaments.webp";
import drum from "/assets/artifacts/drum.jpeg";
import ritualStaff from "/assets/artifacts/ritual-staff.jpg";
import dwellingRoofThatch from "/assets/artifacts/dwelling-roof-thatch.webp";
import fireStarterKit from "/assets/artifacts/fire-starter-kit.webp";

export const artifactCategories = [
  { id: "all", name: "All Artifacts", icon: "🏛️" },
  { id: "weapons", name: "Weapons & Tools", icon: "🏹" },
  { id: "pottery", name: "Pottery & Vessels", icon: "🏺" },
  { id: "jewelry", name: "Jewelry & Ornaments", icon: "💍" },
  { id: "clothing", name: "Clothing & Textiles", icon: "👔" },
  { id: "ritual", name: "Ritual Objects", icon: "🕯️" },
  { id: "dwelling", name: "Dwelling Items", icon: "🏠" },
];

export const artifacts = [
  {
    id: 1,
    name: "Bamboo Bow (Dhanu)",
    veddaName: "Dhanu",
    category: "weapons",
    era: "Traditional Era",
    dateRange: "Pre-colonial to present",
    description:
      "A traditional bamboo bow used by Vedda hunters for hunting wild game in the Sri Lankan forests. The bow represents the Vedda people's deep connection with nature and their hunting traditions.",
    longDescription:
      "The Vedda bamboo bow, known as 'Dhanu' in their language, is a masterpiece of indigenous craftsmanship. Made from carefully selected bamboo stems, the bow is crafted with precision and knowledge passed down through generations. The bowstring is traditionally made from twisted bark fibers or plant materials. The bow's design reflects the Vedda people's intimate understanding of forest materials and their properties. Hunting with the bow was not just a means of survival but a spiritual practice, with hunters offering prayers and respecting the animals they hunted.",
    materials: ["Bamboo", "Natural fiber string", "Tree bark"],
    dimensions: "Approximately 150-180 cm in length",
    culturalSignificance:
      "The bow is a symbol of Vedda identity and their hunting heritage. It represents their sustainable relationship with the forest ecosystem and their role as traditional forest dwellers.",
    usageContext:
      "Primarily used for hunting small to medium-sized game such as wild boar, deer, and various forest birds. The bow was essential for the community's food security.",
    modernStatus: "Still crafted and used by some traditional Vedda communities",
    imageUrl: bamboobow,
    relatedArtifacts: [2, 3],
    funFacts: [
      "Vedda hunters could accurately shoot arrows up to 50 meters",
      "Young boys began learning archery skills from age 5",
      "Each bow was personalized and considered sacred to its owner",
    ],
  },
  {
    id: 2,
    name: "Stone Arrow Points (Kadavara)",
    veddaName: "Kadavara",
    category: "weapons",
    era: "Ancient to Traditional Era",
    dateRange: "Pre-historic to 19th century",
    description:
      "Carefully crafted stone arrowheads used with bamboo bows for hunting. These points showcase the Vedda people's stone-working skills and hunting technology.",
    longDescription:
      "Stone arrow points, or 'Kadavara', represent some of the earliest technologies used by the Vedda people. Made from quartz, chert, or other suitable stones found in the forests, these arrowheads were carefully shaped through a process called knapping. The craftsperson would strike the stone at precise angles to create sharp edges and the desired shape. The finished points were then attached to wooden or bamboo shafts using natural resins and plant fibers. Different shapes and sizes were used for different types of game.",
    materials: ["Quartz", "Chert", "Flint", "Natural resin", "Plant fibers"],
    dimensions: "2-5 cm in length",
    culturalSignificance:
      "Arrow points represent the technological ingenuity of the Vedda people and their adaptation to forest life over thousands of years.",
    usageContext:
      "Used for hunting various animals. Larger points for big game like wild boar, smaller for birds and small mammals.",
    modernStatus:
      "Rarely made today; mostly found in archaeological sites and museums",
    imageUrl: stoneArrowPoints,
    relatedArtifacts: [1, 3],
    funFacts: [
      "Some Vedda stone tools date back over 30,000 years",
      "The skill to make perfect arrowheads took years to master",
      "Different stone types produced different cutting qualities",
    ],
  },
  {
    id: 3,
    name: "Axe (Goda)",
    veddaName: "Goda",
    category: "weapons",
    era: "Traditional Era",
    dateRange: "Pre-colonial to present",
    description:
      "A versatile tool used for cutting wood, clearing paths, and various daily tasks. The axe was essential for survival in the forest environment.",
    longDescription:
      "The Vedda axe, called 'Goda', evolved over time from stone heads to metal blades obtained through trade. The traditional stone axe featured a carefully shaped stone head attached to a wooden handle with strong bindings. Later versions incorporated metal heads, which were highly valued. The axe served multiple purposes: cutting firewood, clearing vegetation, constructing shelters, and occasionally for defense. The handle was typically made from hard, durable wood and shaped to fit comfortably in the hand for extended use.",
    materials: ["Stone or metal head", "Hardwood handle", "Natural fiber binding"],
    dimensions: "30-50 cm total length",
    culturalSignificance:
      "Represents the Vedda people's resourcefulness and their ability to shape their environment while living in harmony with nature.",
    usageContext:
      "Daily tool for wood cutting, shelter construction, and forest management. Essential for family survival.",
    modernStatus: "Still used by traditional communities",
    imageUrl: axe,
    relatedArtifacts: [1, 2, 6],
    funFacts: [
      "A well-made axe could last for generations",
      "The axe handle was often decorated with meaningful carvings",
      "Different axe types existed for different tasks",
    ],
  },
  {
    id: 4,
    name: "Clay Pot (Muttiya)",
    veddaName: "Muttiya",
    category: "pottery",
    era: "Traditional Era",
    dateRange: "Ancient to present",
    description:
      "Hand-formed clay pots used for cooking, water storage, and food preparation. These vessels showcase traditional Vedda pottery skills.",
    longDescription:
      "The 'Muttiya' is a traditional clay pot representing the Vedda people's pottery tradition. Unlike wheel-thrown pottery, Vedda pots were hand-formed using coiling techniques. Clay was gathered from riverbanks, cleaned, and mixed with sand or crushed shell for strength. The pots were shaped by hand, dried in the sun, and fired in open fires. These vessels were essential for daily life - cooking wild yams and meat, storing water and honey, and fermenting traditional foods. The simple, functional design reflects the Vedda philosophy of taking only what is needed from nature.",
    materials: ["Natural clay", "Sand or crushed shell temper", "River water"],
    dimensions: "Various sizes from 10 cm to 40 cm in diameter",
    culturalSignificance:
      "Pottery represents the Vedda transition from purely hunting-gathering to more settled patterns, while maintaining their forest connection.",
    usageContext:
      "Daily use for cooking, storage, and food preparation. Some pots had ritual significance for ceremonies.",
    modernStatus: "Traditional pottery still made by some Vedda families",
    imageUrl: clayPot,
    relatedArtifacts: [5, 13],
    funFacts: [
      "Pots were often decorated with natural pigments and patterns",
      "Each family had distinct pottery styles",
      "Broken pottery pieces were sometimes used as tools",
    ],
  },
  {
    id: 5,
    name: "Honey Collecting Vessel",
    veddaName: "Mee Bambara",
    category: "pottery",
    era: "Traditional Era",
    dateRange: "Ancient to present",
    description:
      "Special containers used for collecting and storing wild honey, one of the most prized foods in Vedda culture.",
    longDescription:
      "The 'Mee Bambara' or honey vessel holds special significance in Vedda culture, as wild honey was one of the most valuable forest resources. These vessels were specifically designed for honey collection and storage. Typically made from clay or hollowed gourds, they featured narrow necks to prevent honey from flowing out and to keep insects away. Honey collection was a skilled and dangerous task, involving climbing tall trees to reach bee hives. The honey was used as food, medicine, and in ritual ceremonies. It was also an important trade item with neighboring communities.",
    materials: ["Clay", "Gourd", "Beeswax for sealing"],
    dimensions: "15-25 cm height",
    culturalSignificance:
      "Honey represents the Vedda people's sophisticated knowledge of forest resources and their sustainable harvesting practices.",
    usageContext:
      "Used during honey collecting expeditions and for storing honey at home. Honey was shared within the community during special occasions.",
    modernStatus: "Traditional honey collection continues in some areas",
    imageUrl: honeyCollectingVessel,
    relatedArtifacts: [4, 12],
    funFacts: [
      "Vedda honey collectors used smoke to calm bees",
      "Honey collecting was a male responsibility passed from father to son",
      "Special chants were sung before collecting honey from the bees",
    ],
  },
  {
    id: 6,
    name: "Bark Cloth",
    veddaName: "Wel Redda",
    category: "clothing",
    era: "Ancient to Traditional Era",
    dateRange: "Pre-historic to 19th century",
    description:
      "Clothing made from beaten tree bark, representing the Vedda's traditional attire before the adoption of woven fabrics.",
    longDescription:
      "Bark cloth, or 'Wel Redda', was the traditional clothing material of the Vedda people before contact with agricultural societies. Made from the inner bark of specific trees, particularly the breadfruit tree, the bark was carefully removed, soaked, and beaten with wooden implements until it became soft and pliable. The resulting fabric was surprisingly durable and comfortable. Men typically wore bark cloth loincloths, while women wore wraparound skirts. The cloth was sometimes decorated with natural dyes from plants and minerals. This clothing reflected the Vedda's deep integration with the forest ecosystem.",
    materials: ["Tree bark (especially breadfruit)", "Natural plant dyes"],
    dimensions: "Variable, depending on use",
    culturalSignificance:
      "Bark cloth represents the Vedda's original forest lifestyle and their ability to utilize forest resources without modern tools.",
    usageContext: "Daily wear for all community members, in all seasons",
    modernStatus:
      "No longer commonly used; replaced by woven textiles from the 19th century",
    imageUrl: barkCloth,
    relatedArtifacts: [7, 8],
    funFacts: [
      "Bark cloth could last for several months with proper care",
      "The making of bark cloth was primarily women's work",
      "Different trees produced different textures and colors",
    ],
  },
  {
    id: 7,
    name: "Shell Necklace",
    veddaName: "Kara Malaya",
    category: "jewelry",
    era: "Traditional Era",
    dateRange: "Ancient to present",
    description:
      "Decorative necklaces made from river shells and seeds, worn for both aesthetic and protective purposes.",
    longDescription:
      "Shell necklaces, or 'Kara Malaya', are beautiful examples of Vedda jewelry craftsmanship. Made from shells collected from rivers and streams, along with seeds, bones, and sometimes small stones, these necklaces served both decorative and spiritual functions. The shells were carefully drilled using stone tools and strung on plant fiber cords. Each necklace was unique, reflecting the maker's creativity and the available materials. Certain shells and seeds were believed to provide protection from evil spirits or bad luck. Necklaces were often given as gifts between family members or during courting rituals.",
    materials: ["River shells", "Seeds", "Plant fiber cord", "Animal bones"],
    dimensions: "30-50 cm length",
    culturalSignificance:
      "Jewelry represents personal expression and social connections within the community, as well as spiritual beliefs.",
    usageContext:
      "Worn during daily activities and special ceremonies. Some pieces were specific to gender or age groups.",
    modernStatus: "Still crafted and worn, often mixed with modern materials",
    imageUrl: shellNecklace,
    relatedArtifacts: [8, 9],
    funFacts: [
      "Each shell type had specific meanings and uses",
      "Children received their first necklace at an important age milestone",
      "Some shells were traded from coastal areas, showing ancient trade networks",
    ],
  },
  {
    id: 8,
    name: "Bone Ornaments",
    veddaName: "Hin Alankara",
    category: "jewelry",
    era: "Ancient to Traditional Era",
    dateRange: "Pre-historic to present",
    description:
      "Ornamental items crafted from animal bones, including pendants, hair pins, and decorative pieces.",
    longDescription:
      "Bone ornaments, or 'Hin Alankara', showcase the Vedda people's utilization of all parts of hunted animals. After consuming meat, bones were cleaned and shaped into various ornamental items. These included pendants, hairpins, ear decorations, and arm bands. The bones were carved, polished, and sometimes decorated with incised patterns. Bone from different animals held different significance - deer bones were particularly valued. Creating these ornaments required skill and patience, as bone must be worked carefully to avoid breaking. The ornaments often featured geometric patterns or representations of animals and natural elements.",
    materials: ["Animal bones (deer, boar, etc.)", "Stone carving tools"],
    dimensions: "Variable, typically 5-15 cm",
    culturalSignificance:
      "Represents the Vedda principle of using all parts of hunted animals and honoring the animal's sacrifice through continued use.",
    usageContext:
      "Worn during daily life and ceremonies. Some pieces indicated status or achievements.",
    modernStatus: "Still occasionally crafted for cultural preservation",
    imageUrl: boneOrnaments,
    relatedArtifacts: [7, 9],
    funFacts: [
      "The best carved pieces were considered valuable enough to trade",
      "Certain bone ornaments were worn only by successful hunters",
      "Bones were often engraved with stories or symbols",
    ],
  },
  {
    id: 9,
    name: "Ritual Drum (Bera)",
    veddaName: "Bera",
    category: "ritual",
    era: "Traditional Era",
    dateRange: "Ancient to present",
    description:
      "Traditional drums used in ceremonies and rituals to communicate with spirits and ancestors.",
    longDescription:
      "The 'Bera' is a sacred drum central to Vedda ritual and ceremonial life. These drums are typically made from hollowed tree trunks with animal skin stretched across one or both ends. The skins (usually from deer or wild boar) are attached using plant fiber cords that can be tightened to adjust the drum's pitch. The drum's body is often decorated with natural pigments and carved patterns. Playing the drum was a specialized skill, with specific rhythms used for different ceremonies - healing rituals, ancestor worship, seasonal celebrations, and coming-of-age ceremonies. The drum was believed to create a bridge between the physical and spiritual worlds.",
    materials: ["Hollow tree trunk", "Animal skin", "Plant fiber cords", "Natural dyes"],
    dimensions: "30-60 cm height, 20-40 cm diameter",
    culturalSignificance:
      "The drum is essential for maintaining spiritual connections and preserving ritual traditions. It represents the heartbeat of Vedda culture.",
    usageContext:
      "Used exclusively in religious and ceremonial contexts by designated ritual specialists.",
    modernStatus: "Still actively used in Vedda ceremonies and cultural events",
    imageUrl: drum,
    relatedArtifacts: [11, 12],
    funFacts: [
      "Different drum rhythms could call specific spirits",
      "Drums were considered sacred objects and kept in protected places",
      "The right to play ceremonial drums was inherited or specially granted",
    ],
  },
  {
    id: 10,
    name: "Ritual Staff (Kija)",
    veddaName: "Kija",
    category: "ritual",
    era: "Traditional Era",
    dateRange: "Ancient to present",
    description:
      "A ceremonial staff carried by spiritual leaders during rituals, symbolizing authority and spiritual connection.",
    longDescription:
      "The 'Kija' or ritual staff is a powerful symbol in Vedda spiritual practice. Typically carved from a single piece of hard wood, the staff stands about shoulder-height and features intricate carvings representing spirits, animals, and natural forces. The top of the staff often depicts the head of a serpent or bird, both important in Vedda cosmology. The staff is carried by the 'Kapurala' (spiritual leader) during ceremonies, used to mark sacred space, and sometimes believed to channel spiritual energy. Creating a ritual staff is a sacred process, requiring not just skill but spiritual preparation and blessing.",
    materials: ["Hardwood (ebony or similar)", "Natural oils for finish"],
    dimensions: "120-150 cm height",
    culturalSignificance:
      "Represents spiritual authority and the connection between the community, ancestors, and natural spirits.",
    usageContext:
      "Used by spiritual leaders during healing ceremonies, ancestor rituals, and major community events.",
    modernStatus: "Still made and used by traditional Vedda religious practitioners",
    imageUrl: ritualStaff,
    relatedArtifacts: [10, 12],
    funFacts: [
      "Each staff is unique and considered to have its own spiritual power",
      "Staffs are named and treated as living spiritual entities",
      "A spiritual leader's staff is often buried with them",
    ],
  },
  {
    id: 11,
    name: "Dwelling Roof Thatch",
    veddaName: "Gedara Alaya",
    category: "dwelling",
    era: "Traditional Era",
    dateRange: "Ancient to present",
    description:
      "Traditional roofing material made from palm leaves and grass, essential for forest dwelling construction.",
    longDescription:
      "The 'Gedara Alaya' or dwelling roof represents the Vedda's sophisticated understanding of forest architecture. Traditional Vedda dwellings were simple but effective structures, with roofs made from carefully layered palm fronds, large leaves, and grass. The construction technique involved selecting the right materials - typically coconut or kitul palm leaves - and layering them in a way that would shed water while allowing air circulation. The leaves were tied to a bamboo frame using plant fiber cords. A well-constructed roof could last several rainy seasons. The dwelling itself was temporary, reflecting the semi-nomadic lifestyle of traditional Vedda communities who moved with seasonal hunting patterns.",
    materials: ["Palm fronds", "Grass", "Large leaves", "Bamboo frame", "Plant fiber"],
    dimensions: "Variable, typically 3x4 meters for family dwelling",
    culturalSignificance:
      "Represents the Vedda's mobile lifestyle and their philosophy of living lightly on the land without permanent impact.",
    usageContext:
      "Primary shelter construction for families, temporary camps, and seasonal dwellings.",
    modernStatus:
      "Traditional construction methods maintained by some communities, though many now use modern materials",
    imageUrl: dwellingRoofThatch,
    relatedArtifacts: [14, 15],
    funFacts: [
      "A skilled family could construct a dwelling in one day",
      "Roof construction was a community activity with everyone helping",
      "The angle and overlap of leaves were calculated to handle monsoon rains",
    ],
  },
  {
    id: 12,
    name: "Fire Starter Kit",
    veddaName: "Gini Patan Yantra",
    category: "dwelling",
    era: "Ancient to Traditional Era",
    dateRange: "Pre-historic to 20th century",
    description:
      "Traditional fire-starting tools using friction method, essential for daily survival in the forest.",
    longDescription:
      "The 'Gini Patan Yantra' or fire starter kit represents fundamental survival technology of the Vedda people. The kit typically consisted of a fire drill (a straight hardwood stick) and a fire board (a flat piece of softwood with a small depression). To start a fire, the drill was rapidly rotated between the palms while pressed into the depression, creating friction heat that produced an ember in accumulated wood powder. This ember was then carefully transferred to a tinder bundle of dry grass, bark, or leaves and blown into flame. The knowledge of which woods to use, the right pressure and speed, and the best tinder materials was crucial survival knowledge passed down through generations.",
    materials: [
      "Hardwood drill stick",
      "Softwood fire board",
      "Tinder materials (dry leaves, bark)",
      "Sometimes a bow drill with cord",
    ],
    dimensions: "Drill: 30-40 cm, Board: 20x10 cm",
    culturalSignificance:
      "Fire was central to Vedda life - for cooking, warmth, protection from animals, and social gathering. Maintaining fire-making knowledge was a survival necessity.",
    usageContext:
      "Daily use for starting cooking fires and maintaining the community hearth. Essential skill for hunters and travelers.",
    modernStatus: "Largely replaced by modern fire-starting methods, maintained as cultural knowledge",
    imageUrl: fireStarterKit,
    relatedArtifacts: [13, 3],
    funFacts: [
      "A skilled person could start a fire in under a minute",
      "The sacred community fire was never allowed to go out completely",
      "Different wood combinations worked better in wet versus dry conditions",
    ],
  },
];

// Helper function to get artifacts by category
export const getArtifactsByCategory = (categoryId) => {
  if (categoryId === "all") return artifacts;
  return artifacts.filter((artifact) => artifact.category === categoryId);
};

// Helper function to search artifacts
export const searchArtifacts = (query) => {
  const lowercaseQuery = query.toLowerCase();
  return artifacts.filter(
    (artifact) =>
      artifact.name.toLowerCase().includes(lowercaseQuery) ||
      artifact.veddaName.toLowerCase().includes(lowercaseQuery) ||
      artifact.description.toLowerCase().includes(lowercaseQuery) ||
      artifact.culturalSignificance.toLowerCase().includes(lowercaseQuery)
  );
};

// Helper function to get related artifacts
export const getRelatedArtifacts = (artifactId) => {
  const artifact = artifacts.find((a) => a.id === artifactId);
  if (!artifact || !artifact.relatedArtifacts) return [];
  return artifacts.filter((a) => artifact.relatedArtifacts.includes(a.id));
};
