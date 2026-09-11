/**
 * 新概念英语 · 闯关模式
 * - 地图视图：星阵围棋式蜿蜒关卡地图，一课 = 一个关卡，节点显示「已过关句子/总句子」
 * - 全局黑白主题切换（地图 + 终端统一），白底更白
 * - 严格顺序闯关：第一册通关才能进入下一册，依次往后，不能跳关
 * - 终端视图：进入关卡才显示，Linux 命令行输出流
 * - 每关流程：预览原文 → 开始闯关(隐藏原文，可切换译文) → 输入 → 检查(红标差异)
 * - 进度存 localStorage，支持导出 / 导入(跨浏览器迁移)
 */
(function () {
  'use strict';

  const DATA = window.NCE_LEARN;
  const STORE_KEY = 'nce-challenge-progress-v1';

  // 密码词库：雅思高频词（已剔除新概念单词并打乱，最终可直接使用）
  const WORD_POOL = [
    'versus','prattle','emotional','nugatory','cohesion','invoke','tenable','neoclassical','notion','manor','specify','stubborn',
    'flaunt','appreciable','aboriginal','subscription','refectory','genius','repaint','enrolment','ensue','slag','testimony','checkup',
    'irrevocable','orchard','species','errand','vast','minimise','upper','polar','infection','attractive','oscillate','tributary',
    'synonym','vicissitude','differ','delay','frown','cosy','excess','systematic','discerning','contingency','surmount','coincide',
    'cube','budget','auction','characterize','unwrap','speculation','inherit','encode','paradox','enrich','inflammable','availability',
    'corrupt','deny','embody','inland','expose','maladroit','trick','coach','gelatin','yawn','whaling','lounge',
    'flavour','emphasize','garment','occasional','effrontery','molest','internationalist','morbid','apt','hatch','economical','maim',
    'amuse','plagiarism','chin','inapt','affection','cooperate','wary','otherwise','halve','troupe','conduct','emergency',
    'intent','dial','rouse','contract','electrician','quartz','decade','estate','opaque','elevate','nutritious','janitor',
    'mortal','engagement','flask','congruent','fastidious','postgraduate','curb','default','alienate','exonerate','stabilize','depart',
    'melodious','mentality','supportive','reticent','discreet','dock','obsession','alchemist','knob','repetition','intern','medication',
    'harass','feat','usurp','deviate','shabby','diameter','evolution','lottery','prestige','embargo','challenge','negation',
    'receipt','generative','intermediate','lethal','adventure','subtract','validity','dose','nautical','raw','mutter','rife',
    'revolve','condolence','invigilate','saline','coed','persist','conceive','dwell','madden','gill','storage','toll',
    'antonym','fawn','controversial','ethnic','infelicitous','crusade','trenchant','impetuous','relevant','groan','statesman','flirt',
    'procure','evaporate','maiden','storyline','currency','petition','plaudit','execute','identification','redeem','practically','monetary',
    'congestion','bind','impecunious','utmost','hinge','initial','deliberate','patriotic','dilettante','adroit','intensity','pretension',
    'contest','audacious','undergraduate','outpost','majority','wildlife','hearing','insulate','ostensible','whip','circumference','pest',
    'contact','detrimental','criticise','unilateral','outweigh','thermal','embankment','grant','enzyme','realistic','inhabit','tide',
    'subjective','fecund','mimic','relinguish','longitudinal','minus','abortion','merge','lobby','issue','vacant','duplicate',
    'forte','venture','diligent','vain','parade','dictation','comparatively','paranoia','attraction','egregious','throughout','shareholder',
    'roam','approximately','epithet','blade','appendix','timber','subsequent','sizeable','swap','acceptable','literal','analogous',
    'propinquity','burrow','hardy','slap','preface','holistic','sarcasm','update','juggernaut','obedient','grin','supplementary',
    'jaded','penalty','fruitful','numerate','hum','misconception','schism','application','controversy','inimical','grand','autobiography',
    'hoist','sector','authorize','municipal','audience','pathway','gene','influx','weave','construct','exhaust','proclaim',
    'dilute','vary','initiative','slab','insurgent','inborn','petal','atomic','manacle','assault','genetic','moist',
    'hysterical','shatter','contiguous','literacy','hurricane','resit','handy','acute','sundial','crushing','pageant','eulogy',
    'fatigue','vicious','academic','oppose','surcharge','plaintive','propellant','tolerable','supervisor','acoustic','avail','division',
    'organize','summon','supervision','opt','spectrum','flush','reign','theory','delivery','assuage','slope','pilgrim',
    'scar','accountable','subsidise','reunion','stammer','mire','misappropriate','senior','modish','waver','prosper','mite',
    'freight','triple','outlaw','likewise','peripheral','censure','proselytize','puerile','focus','aesthetic','sympathise','peremptory',
    'manufacturer','uphill','doctoral','traverse','crush','hackneyed','altitude','persevere','cuisine','centennial','derelict','proficiency',
    'conducive','terse','candidate','swirl','attentive','simplify','eke','nocturnal','qualify','trickle','conference','warden',
    'gaudy','acknowledge','fragile','pollutant','insulation','aptitude','ovation','demolish','iniquity','collaboration','maximise','disposable',
    'untrustworthy','gregarious','spouse','metallic','pulp','languid','junction','retrieve','reinforce','striated','decrease','microcosm',
    'stitch','highland','draft','portion','convene','uncertainty','overgraze','perplex','manipulative','generalize','colonial','rot',
    'salinity','confuse','authentic','molten','culpable','qualm','cruel','renowned','absorb','rendition','activate','responsive',
    'ignorant','assert','exigent','vigilant','admonish','departmental','specious','piecemeal','herbal','stroke','infrastructure','pertinent',
    'squash','siesta','boost','lecture','simplistic','tablet','audition','alight','gadget','cherry','plus','aspire',
    'thirst','spill','flexitime','terrific','infer','laborious','nicety','inevitable','archive','federation','superstitious','sediment',
    'repent','obstruct','metric','executive','fortnight','skyscraper','vagary','evident','literate','compel','cushion','manure',
    'clamp','responsibility','asthma','corporate','inventive','intrinsic','drown','cite','grid','extinguish','ubiquitous','thermometer',
    'instigate','numb','certificate','wretch','camper','thesis','smother','mosquito','interfere','archaic','ameliorate','viscous',
    'uprising','pursuit','durable','catalyst','ethical','sponge','adjacent','slippery','fabric','subordinate','exhilaration','oar',
    'invoice','mate','ratio','denial','slaughter','participate','procedure','unveil','nordic','friction','chop','contrary',
    'pregnant','disapprove','nourishment','granular','dodge','survival','curly','ensemble','levy','sluggish','millennium','sustenance',
    'eradicate','tactic','cumbersome','sensible','geometry','slice','random','cute','conductive','circulate','septic','signify',
    'prevaricate','technical','incentive','dispose','intermix','kit','lapse','representative','recognition','insolent','preach','hamper',
    'exploit','facetious','limitation','attribute','luxuriant','posture','brevity','deprive','wield','define','ceramic','score',
    'adventurous','phonetic','prone','superintend','concern','mammal','vulgar','downpour','embezzle','merit','cavity','gullible',
    'confirmation','rampant','exegesis','extort','caption','enslave','structure','plague','pollinate','indicator','distraction','ward',
    'operational','damp','revive','concoct','steadfast','supposition','crooked','cookery','lever','hectare','isolated','revival',
    'security','snobbish','likelihood','hierarchy','reliable','sauce','maturity','pseudonym','solo','quagmire','phenomenon','chunk',
    'browse','ongoing','grocery','trespass','tribal','begrimed','substantial','insult','auxiliary','render','endeavor','artillery',
    'nominate','longitude','forbearance','sedulous','oncoming','majestic','mime','pretext','consonance','load','charm','enforce',
    'protract','incendiary','sensory','cannon','strive','feedback','excessive','bit','temporal','discount','aeration','harangue',
    'referendum','leather','condense','fort','allegiance','jail','soluble','clinic','phenomenal','monsoon','disinterested','porch',
    'engross','cocaine','asymmetry','garrulous','meditate','sift','outset','malleable','cafeteria','infiltrate','estrange','vein',
    'alluvial','upbringing','slit','exclude','instinct','ingredient','intensify','eddy','transcription','haughty','superstructure','wager',
    'cane','landmark','solicitor','aridity','meddle','sightseeing','applaud','prominent','rigid','ornamental','peripatetic','herd',
    'armour','palatable','equitable','concurrent','unsanitary','scant','bonus','motive','feud','represent','deficit','sponsor',
    'cervical','instalment','adequate','pottery','plight','tug','idiom','rancor','alphabetical','heap','conserve','directory',
    'cape','scenery','patriotism','deluge','plea','arbitrary','spoilage','substitute','proscribe','leak','paddle','dictate',
    'worm','synchronize','forerunner','tease','yard','antipathy','regulate','proclivity','discern','transistor','reciprocal','variant',
    'avert','device','insight','resource','generic','original','frustrating','tangy','lenient','tirade','fierce','cashier',
    'guideline','grief','swamp','militant','interface','furnace','disfigure','obligation','inference','automobile','deduct','gesture',
    'motif','outfit','recant','scalpel','souvenir','illustrate','nullify','tout','intellect','magnanimous','fume','overdue',
    'landward','referee','statute','legend','vague','institution','obligatory','statistically','ecliptic','foetus','pithy','carrier',
    'manifest','female','extension','epidemic','airing','darkroom','grassy','snack','stout','exceedingly','namely','repack',
    'probe','dystrophy','regional','sober','permit','unemployment','harmony','organ','fracture','terrain','slot','adverse',
    'excavation','muscle','vertebrate','recalcitrant','strain','blonde','degenerate','resistant','automation','incidentally','animate','latitude',
    'fluff','grit','glossy','nominal','caution','truce','exquisite','grim','batch','rococo','geometric','quiver',
    'commonwealth','earthwork','consistent','forgive','rage','sceptical','singular','touchy','escalate','amend','overhear','biodiversity',
    'reckless','promote','enhance','ascend','propel','porous','ancestor','diversify','discriminate','stash','emanate','overlook',
    'contrite','expedient','timidity','henceforth','shrink','marsupial','cultivation','radius','fund','nutritional','perfidious','branch',
    'decree','implicit','suspense','profuse','pervert','sewer','accustom','voluntary','dishevel','provoke','estuary','revegetate',
    'ponder','endurance','explore','inspiring','preen','vice','politic','dolphin','masculine','appropriate','internal','hike',
    'refulgent','gang','alliance','elastic','newsletter','sturdy','subversive','commemorate','version','exceed','taxation','autocratic',
    'anecdotal','spasmodic','anniversary','predisposition','trivialize','inebriate','tutor','include','fertile','anomaly','segregate','rational',
    'therapy','timid','consume','explode','plankton','paucity','environment','motion','semantic','declaration','ragged','wholesome',
    'incompatible','megacity','mould','swell','arithmetic','chink','renew','assassination','counterfeit','legitimate','fumes','impartial',
    'generalise','embellish','aggressiveness','outline','dine','peel','foreseeable','saddle','harsh','mint','custom','murmur',
    'thunder','pronounceable','depletion','split','moreover','occlude','sedentary','ambiguous','camouflage','sanitary','unrest','collaborate',
    'conversion','emphasis','defiance','horizontal','comet','infant','apprehension','infringe','augment','liability','spade','potent',
    'reservation','abound','retrench','latent','potential','womb','spokesman','shaft','havoc','frenetic','disarray','pinpoint',
    'delinquency','ebullient','retailing','manufacture','vanish','homestay','neutral','handicap','sociology','conservatism','humdrum','posterity',
    'affirm','substitution','economy','dash','curriculum','lag','noxious','irritable','tumble','defraud','lock','urbane',
    'refine','recourse','hectic','civic','accomplish','fertilise','expunge','remnant','concise','mature','sanctimonious','adolescent',
    'rear','pillar','personnel','partition','turbid','almond','larva','airtight','stultify','exhibit','achieve','detract',
    'defect','suppression','pervasive','prologue','brutal','ponderous','negotiable','abate','drawback','obsess','asset','anthology',
    'sequester','froward','disaffect','interdict','interpolate','aerospace','insufficient','elucidate','espouse','haste','veterinary','creation',
    'concede','hence','aquatic','mall','diplomat','splenetic','gloss','forestall','jagged','restrain','inversion','sparse',
    'contribute','click','toddle','ascent','crumble','metro','fuel','bureaucracy','stint','justify','loan','exhilarate',
    'resonant','reciprocate','tenacious','flyover','subsidiary','convivial','provision','scent','quest','flap','premise','proceeding',
    'iconoclast','discretion','distribute','startle','whistle','inclusive','laudable','necessitate','defunct','juvenile','stylish','copious',
    'lucrative','hurdle','transaction','finitude','shelter','crumple','tab','commentary','harbinger','increment','hubbub','debris',
    'adobe','palm','clearance','coeducation','prohibitive','wording','apathetic','clarify','tranquility','suite','congress','exterior',
    'secondary','tan','oasis','heritage','chorus','upright','practitioner','reserved','accountancy','appease','autoimmune','amalgamate',
    'ostentation','infirmary','option','futile','impetus','bay','venomous','dispatch','array','evince','obscene','prevail',
    'vilify','formulate','verisimilitude','tick','reclaim','toneless','physiological','variation','relapse','margin','mansion','blanket',
    'gist','resilience','disposition','thrill','gradual','chapel','factious','improve','motivate','fallacious','tense','rigorous',
    'unfold','breakthrough','congested','preceding','spin','contrast','indelible','tropical','devastating','extract','healing','whereby',
    'cultural','demographic','subside','sterilize','prevalence','glacier','permeate','adjust','loyalty','intervene','classification','resort',
    'acquaint','reliance','coerce','apace','throbbing','flux','narcotic','momentous','detest','spontaneous','metropolitan','pacify',
    'complementary','painstaking','riot','displace','cautious','remedy','affix','ammunition','nap','conquest','terminology','hegemony',
    'confess','domination','plenary','technique','enroll','install','muddle','distribution','inferential','excerpt','gauche','merely',
    'ancestral','forge','evict','conspicuous','abrasion','disorientate','legislation','unconditional','multinational','deplete','migrant','congenial',
    'recital','hypothesis','ownership','misguided','flip','expenditure','cascade','finance','receptionist','plumb','concession','addiction',
    'genial','faculty','violence','pour','immigrant','picturesque','telex','cynical','maritime','speciality','esteem','virtual',
    'item','mordant','dredge','continuous','garbage','bronchitis','convict','cancel','imposing','overlie','divisional','perceive',
    'epilogue','derive','lethargy','pulley','mettle','wagon','entwine','vivacious','probability','convey','taciturn','herb',
    'adapt','fraught','indigenous','meaningful','emperor','courtesy','idle','revenue','conditioner','photocopy','pivot','formality',
    'corporal','owe','embrace','sulphur','promotion','germinate','enact','inheritance','exorbitant','dissertation','dip','cork',
    'humiliate','expansion','corrode','proliferate','award','monumental','jeer','disguise','oblivious','passive','restive','mobilize',
    'enigma','heighten','huddle','impose','postage','term','plug','devoid','principle','lax','cylinder','laundry',
    'moustache','intercede','shanty','sanguine','counterproductive','transfuse','inept','laden','traction','bamboo','trim','stem',
    'detach','onslaught','essence','floral','momentum','amplify','harridan','tender','perennial','acrobatic','prior','valve',
    'ascetic','predictable','tenuous','factual','divine','function','rank','divide','regeneration','inferior','ordeal','paean',
    'combat','conceptual','whilst','solicit','appraisal','supplant','intact','moderate','albeit','entrepreneurial','credentials','escalator',
    'pedestrian','scatter','libertine','emboss','dazzle','flabby','pinch','circulation','tilt','linguistic','irrespective','psychiatry',
    'prosaic','formal','lame','germ','authoritative','outstrip','waggon','earnest','feminism','feasible','administration','reckon',
    'ozone','spacecraft','intense','constrict','combine','incognito','modernism','moss','criterion','authorise','variable','repatriate',
    'attitude','distill','transit','homogeneous','upkeep','gracious','ambiguity','protest','blithe','diploma','visa','grind',
    'allot','nasty','holocaust','veterinarian','reject','commerce','eclipse','concur','jumble','participation','additional','starchy',
    'indolent','slander','curtail','miscarriage','expectation','notation','drum','vacillate','origin','disagree','nostrum','fringe',
    'crumb','carpenter','lease','recipe','facility','gush','justification','decibel','shift','marrow','tacit','livelihood',
    'elicitation','oak','infirmity','scrutinize','greedy','hop','daunt','fossil','reconcile','prospective','rumour','drowse',
    'disillusion','vision','editorial','turmoil','flame','inaugurate','haven','aupair','fallible','furious','tenancy','indefinite',
    'dwindle','protrude','infinite','microbe','irascible','twinkle','postcode','extendable','auditorium','antidote','casualty','cripple',
    'potion','interpret','howl','enquiry','magistrate','client','requisition','historic','ultraviolet','weaken','dioxide','crank',
    'inane','revolution','growl','innovate','churlish','voucher','deterioration','accommodate','nickel','tuition','indemnify','oxide',
    'suspend','spectacular','amid','indemnity','decay','wrinkle','wastage','passionate','incline','reprobate','register','piston',
    'dispersal','pitch','moderation','benevolent','judicial','dexterous','trustworthy','understandable','mask','stabilise','prolonged','ravage',
    'mode','twofold','suicidal','worthy','undercharge','adhere','gauge','expatiate','employment','efficient','retort','murky',
    'pliable','cantonese','perception','legitimacy','apprehensive','ferocious','suppliant','shoal','distil','overshadow','artefact','tangibly',
    'imperative','veracious','impoverished','sorrow','sufficient','credible','disturbance','vow','sardonic','expertise','ailment','blunt',
    'stern','terrace','gloomy','smuggle','exaggerate','consolidation','slacken','protocol','perimeter','curative','awkward','fitting',
    'cue','prioritize','wit','subsoil','savage','diurnal','specialist','processor','pariah','sieve','eligible','refinement',
    'maneuver','chiche','condone','compassionate','jolt','crisp','cordial','stipulate','gender','compliment','supersonic','crease',
    'fabrication','thumb','cartoon','verge','lodging','austere','outcome','spectator','denomination','amends','marvellous','inhale',
    'complement','spotlight','cradle','perplexity','piety','navigable','foul','filter','unsatisfactory','scope','tariff','stress',
    'enhancer','shrub','clip','underneath','fellowship','cricket','ditch','transcend','conversely','component','wrench','implicate',
    'probation','laterality','brew','credential','cash','turbine','drudgery','superficial','induce','sore','unctuous','breed',
    'disgust','divulge','bleak','mainly','tentacle','valid','vent','renege','poise','metaphor','amphibian','toil',
    'geological','antibiotic','internship','underestimate','analytical','absolute','penetrate','cheat','lucid','methane','kidnap','diverse',
    'miscellaneous','necessarily','melody','glitter','hemisphere','ludicrous','foam','molecule','elbow','thoughtful','cathedral','license',
    'atmospheric','landfill','annuity','prerogative','oversee','expatriate','regurgitate','sporadically','expedition','enlighten','expire','pragmatic',
    'relay','kernel','qualification','refreshment','notoriety','goggles','misdeed','belt','overfill','predator','mountainous','inductive',
    'entangle','interrelationship','chic','strategist','delirium','concerted','impromptu','diesel','ultraclean','mineral','highlight','resume',
    'resonate','repudiate','imaginative','thaw','beforehand','aggregate','emeritus','pungent','certify','format','stoop','surge',
    'scrape','conduce','flagrant','consolidate','grate','offset','contemplate','scapegoat','ambivalence','enterprise','requirement','demonstrate',
    'dimension','shepherd','withstand','turgid','toxic','decompose','eliminate','surplus','maintain','lace','project','perishable',
    'strand','assimilation','provenance','scratch','debate','influential','aviation','tissue','encounter','cooperative','facial','agency',
    'excusable','clot','temerity','violate','precipice','sicken','fatal','servile','absurd','toast','insipid','beam',
    'expiate','ultimately','contradiction','athlete','tar','umbrage','expel','tough','delegate','inalienable','commission','irrelevant',
    'echo','allege','inflict','unify','doubtless','await','hygiene','twig','affluent','poster','velocity','refrain',
    'induction','essay','overcome','grouse','reinforcement','concord','marketplace','communication','arrogant','tube','comprise','tournament',
    'ruinous','alacrity','renaissance','callow','mercantile','quiescent','finite','afflicting','trifle','migratory','consumption','massacre',
    'dole','region','vertical','fulfillment','spine','decisive','incongruous','clench','entrepreneur','fate','discredit','frail',
    'rudimentary','append','pathetic','irritate','mentor','jog','equation','scorch','torment','organism','perspire','detriment',
    'payable','deficiency','embarrass','constitution','brand','conspiracy','fluctuate','mildew','fanatic','unregistered','agitation','legislative',
    'tropospheric','pamper','profane','erroneous','extraneous','rarefy','predispose','hapless','annihilate','synthesis','turbulent','trimester',
    'sprint','disastrous','commitment','grasp','seam','periodically','minority','statistic','strip','chronological','consultant','syllabus',
    'emotion','prefabricate','mercenary','expectancy','recall','constituent','incident','dither','exclusively','exploitation','neglect','competence',
    'bankrupt','exhale','disorder','respond','pointless','quit','contend','plethora','alloy','organic','hedge','anticipation',
    'degrade','refresher','specialise','remuneration','pearl','similarly','narrator','incoming','disruptive','suffice','impute','gullibly',
    'precipitate','kindle','grace','scum','clasp','refractory','extrusion','distinction','undue','mishandle','rectify','savour',
    'typhoon','briefcase','reluctance','inclination','domesticate','delinquent','petty','accessible','immigration','excoriate','misuse','scare',
    'misanthrope','diffident','witness','explicit','protein','speculate','resign','consequently','escort','magnitude','incite','craft',
    'calculate','fibre','negotiate','significance','metabolism','twist','norm','mourn','style','competent','proxy','terminal',
    'throng','zoology','negligible','incidence','undisguised','ultimatum','sledge','cooperation','combination','resemble','impede','demerit',
    'morality','methodical','tract','observance','crater','scroll','feast','silicon','attorney','shilling','psychology','manoeuvre',
    'immune','downsize','staid','puissant','compound','dominant','palpitate','pugnacious','literature','harassment','cultivate','legacy',
    'summary','chemical','elegy','fruition','eject','content','overestimate','lawsuit','choir','vulnerable','catalogue','irregularity',
    'width','symphony','imminent','approve','illustration','curve','assimilate','participant','legitimize','transmit','feeble','cord',
    'hassle','immerse','slate','ribbon','inlet','analysis','outdated','battery','implacable','alcohol','acumen','pains',
    'traditional','stride','greasy','belligerent','duplicity','accelerate','pillow','abode','desirable','invert','weapon','ominous',
    'eloquent','heal','emission','thesaurus','gorilla','munificent','tame','culminate','bolster','righteous','weakness','extinction',
    'static','unbiased','unprejudiced','harness','precedent','camel','distort','transportation','calf','preference','occupation','unyielding',
    'facet','extravagance','poisonous','sprawl','wail','imprecation','ideology','junior','ruthless','calorie','inventory','reorient',
    'via','symbolism','shutter','curiosity','wilderness','perpetuate','negative','mutation','pernicious','indication','steamer','interplay',
    'skim','comparable','goal','demolition','inject','compatible','headstrong','literally','glamour','dilemma','gaunt','host',
    'opulent','ulterior','irresistible','mackintosh','coverage','specification','unconscious','notary','dimensional','parental','cinematography','shorthand',
    'gossip','drought','override','prescribe','dearth','crossword','surroundings','squeeze','tractable','encumber','suck','refundable',
    'dart','managerial','pinnacle','pejorative','distortion','piracy','miscreant','invalid','charcoal','defile','outright','climax',
    'stir','trauma','paraphrase','spice','invincible','fluctuation','replace','industrialise','ghastly','repertoire','delude','aluminium',
    'pamphlet','attainable','revelation','vocational','obsequious','melatonin','symposium','purge','entire','reputable','ambition','audio',
    'mushroom','commence','bid','nil','exodus','crocodile','venue','backbone','workaholic','refund','diatribe','esoteric',
    'removal','pessimism','shovel','refusal','vacancy','noisome','parameter','breakdown','convection','transmute','deceive','starch',
    'bow','impair','supplement','void','unassailable','barrage','inflation','stymie','bungalow','odor','plagiarize','menace',
    'burgeon','rhetoric','bin','arrangement','loom','dual','peril','irresolute','limb','tautological','expedite','largesse',
    'magnificent','recondite','gigantic','gainsay','hound','provisional','authenticate','dulcet','naturally','determine','glib','mood',
    'intricate','influenza','gross','slogan','sustain','fieldwork','apparatus','registrar','formula','squalid','marvel','redundant',
    'mischief','cumulative','impugn','prejudice','repugnant','apportion','presuppose','memorable','inundate','turret','embezzlement','badminton',
    'staple','endure','fabulous','doctorate','strident','dormitory','fickle','accuracy','doctrine','judicious','slender','brass',
    'curl','physician','linger','tenet','wedge','earthquake','probable','afield','zeal','malnutrition','hazardous','hockey',
    'eclectic','mirage','irrigation','dorm','tropic','conservatory','solidify','ridiculous','comprehension','stimulus','drench','multiple',
    'correlation','extrapolate','fragrance','interpretation','abundant','infect','maximize','congratulate','minimal','transgress','prestigious','significant',
    'archives','advantageous','biological','malevolent','segment','outcry','imprecise','stake','digital','orchestra','database','spit',
    'mesh','discourage','regardless','reverse','distract','enmity','downtown','presentation','posthumous','episodic','liaise','alignment',
    'saturnine','fret','dour','hostility','dub','assign','combustion','headline','rectangle','inert','pathology','patronage',
    'strategy','exploitative','continental','jaw','retaliate','scan','tag','zone','obliging','wheelchair','separate','erratic',
    'teamwork','deem','configuration','scold','pier','extant','equivalent','purify','mitigate','marvelous','schedule','marginally',
    'naught','legislate','nurture','cemetery','modification','telecommunication','optic','beware','conquer','undergo','optimism','optometrist',
    'procrastinate','execution','insecure','inactive','vacuous','overt','advanced','offensive','lash','aggravation','dizzy','waterproof',
    'affable','disempower','gown','purity','census','parasite','exterminate','scorching','unlikely','dispassionate','lavatory','flexibility',
    'recycle','orientate','edition','fallow','endow','thigh','chord','dispiriting','chronic','susceptible','involve','photography',
    'vibrate','hook','govern','utilise','enthusiastic','impoverish','decrepit','output','coffer','consortium','propaganda','sluttish',
    'hybrid','residential','rally','lavish','requite','indifferent','viable','affiliate','baleful','hamlet','rapacious','scamper',
    'quixotic','barbecue','temperate','bilingual','architecture','beehive','graphology','straightforward','undo','closet','prophecy','subdue',
    'gape','loquacious','mandarin','tickle','bewilder','deference','divert','tribute','gratuity','cursory','unconcerned','cameral',
    'paternity','cosset','pregnancy','idiot','malignant','registration','overview','pertain','innumerable','shield','strait','hallowed',
    'transform','cucumber','fulfil','uphold','propagate','rekindle','abstraction','admission','pedigree','guardian','obnoxious','onerous',
    'reptile','utterly','equilibrium','vouchsafe','meagre','erosion','spatial','verbose','yearn','reinvigorate','limp','scholar',
    'conception','decapitate','interval','stuffing','dismiss','arrange','coward','plagiarise','tinge','guzzle','profligate','carve',
    'omen','slim','patron','tangle','sensation','resent','classic','paraphernalia','ungainly','sausage','edit','raconteur',
    'calcium','disturb','interrogate','periphery','efface','peruse','pharmacy','bibliography','discrepancy','elevator','amenable','prurient',
    'mosaic','subtropical','encompass','upbraid','yoke','fetter','populate','guinea','epoch','decent','flank','profitable',
    'charter','recede','grope','reproduce','consumer','distress','approval','whisper','pension','juxtapose','chaste','religion',
    'acclimatise','renewal','modify','specific','consequent','practicable','plush','character','plunder','merchandising','decorous','carousel',
    'overall','inflate','lexicographer','sincere','principal','versatile','flounder','rail','expend','mutual','consent','discord',
    'hostage','maintenance','manipulate','disinclined','ambulance','sanitation','paragon','acclaim','distinct','arboreal','tillable','centigrade',
    'inhumane','pedantic','administrator','bistro','offspring','informant','assure','fulminate','secure','microscope','mar','evanescent',
    'fauna','chancellor','promising','reap','decimal','habitat','exasperate','ecosystem','bilateral','calibrate','incumbent','pulverise',
    'counterpart','vociferous','commencement','translate','neurosis','circumvent','corporeal','redoubtable','depress','fortify','hypothesize','bulge',
    'couch','booth','nettle','duration','martial','barbaric','consecrate','disintegrate','precision','data','naked','deadline',
    'mastercard','excrement','attain','incisive','didactic','facsimile','voracious','deviance','colloquial','prediction','cognitive','compendium',
    'council','malt','scrupulous','omit','core','retrospect','isolate','deputy','opprobrium','mediate','stolid','hypothetical',
    'introduction','approximate','slide','nutrient','deflect','vex','instil','townscape','compose','elocution','module','innocuous',
    'notch','haphazard','despoil','jeopardize','mandate','vogue','ample','equip','celebrity','alternate','layman','residence',
    'hurl','barrel','gaol','mishap','aspiration','converge','synthesize','layout','epigram','retrenchment','scandal','detain',
    'clause','familiarise','captive','synchronise','gossamer','lap','grip','jeopardise','urbanization','humanistic','propose','monopoly',
    'appliance','shamble','restless','deprecate','endorse','ethereal','insane','isle','silt','sweater','virus','axle',
    'intake','certainty','rendezvous','simplicity','oval','cure','sophisticate','dissemination','overlapping','announce','transcribe','chamber',
    'outskirts','natal','accreditation','cognition','monologue','nonplussed','adolescence','commute','maize','destructive','deft','fantasy',
    'hose','fervid','threshold','career','astray','fitness','frock','scurrilous','web','bullet','thorn','recommend',
    'digest','radiate','platitude','assurance','goodwill','candid','switch','slash','memorandum','visual','respondent','roller',
    'documentation','precipitation','nucleus','facile','specialty','file','coherent','querulous','antecedent','adulation','misrepresent','hereditary',
    'gravity','populace','discrete','deflate','biography','dispense','aver','benefit','bypass','perspective','hypnotic','badge',
    'outsell','relate','excavate','seep','caustic','insularity','liquor','lens','sociable','stereoscopic','sequential','warrant',
    'crawl','liaison','parody','evaluate','veto','utilize','grove','booklet','percussion','unprecedented','beverage','assess',
    'encroach','notify','sophisticated','corpus','flutter','sleek','studious','seal','compliance','throat','propulsion','expiry',
    'ion','stagnate','overwork','invasive','serendipity','paralysis','rehabilitate','comb','emaciated','ape','clarity','decompression',
    'mollify','intimate','glutamate','fluency','yarn','censor','scholarship','waist','transmission','resignation','transition','lateral',
    'smear','enclose','priority','pepper','heir','conjunction','magnetic','avalanche','slouch','simulate','outbreak','triumphant',
    'tumult','sigh','materialistic','crust','inherent','context','yacht','complexity','pastime','mercurial','ceremony','sedition',
    'regime','ornament','civilian','rent','articulate','avenue','surpass','wistful','stove','fold','propriety','commiserate',
    'script','precedence','ramble','filth','nostalgia','dam','electrical','ecological','shred','patrol','mechanism','exposure',
    'unconquerable','boast','deter','guidance','disruption','inquire','consignment','furnish','renewable','mount','convert','somewhat',
    'ignore','misjudge','wheedle','prescience','medieval','perish','confidential','recreate','affect','administer','whereas','slumber',
    'meticulous','alienation','aerobics','underlie','mundane','mortality','pin','feckless','bureau','undoubtedly','edible','plastic',
    'antiquated','upgrade','superb','tension','courageous','interpose','fleet','paralyse','exceptional','ascribe','inspire','optimistic',
    'offence','tedious','dwarf','algebra','forthcoming','altruistic','churn','disillusionment','tumour','slat','artificial','premier',
    'oriental','oppress','handbook','voluble','prominence','conformity','graze','granite','voltage','felicitous','crouch','headquarters',
    'analogy','prospectus','ossify','constant','deadlock','embryo','ingenious','protean','consideration','sinew','catholic','enfranchise',
    'shin','sympathy','herdsman','affluence','popularize','ardent','native','offshore','liable','bore','forth','edify',
    'humane','unparalleled','wreathe','computerize','elated','astute','simultaneous','hesitation','dissolute','conflate','microprocessor','president',
    'instinctual','splash','feature','utterance','arena','meager','disc','imply','interlocutor','cavalier','lump','bulb',
    'grill','conviction','flock','jocular','genteel','refresh','diverge','buckle','fabricate','irony','motivational','prey',
    'gorgeous','permissible','humid','competitive','optimize','discharge','etiquette','toxin','bubble','secular','wholesale','exemplar',
    'dissipate','postmortem','solitary','combustible','astrology','dot','session','particulate','banner','unblemished','banal','goad',
    'panegyric','brochure','foreland','penetration','coexist','legal','tome','limpid','range','habitable','sporadic','accommodation',
    'productive','chicanery','hollow','somnolent','advisable','criminal','undetected','recreation','aquarium','sinecure','commend','slump',
    'coarse','objectify','psychiatric','oblong','uneven','allocate','dusk','amphibious','envisage','knot','devastate','disseminate',
    'scrap','obviate','solvent','perquisite','spiral','oust','locker','hiccup','sake','evaluation','bucket','desultory',
    'misconceive','diagram','varied','triangle','desiccate','uneasy','necessity','twilight','publicity','cardiovascular','wrestle','preliminary',
    'placard','tweezers','cassette','mediocre','myriad','mastery','compute','substantiate','malice','hamster','joint','itinerary',
    'revise','comment','reverent','automatic','histrionic','medal','celestial','utilisation','lambaste','antiquity','dupe','lugubrious',
    'input','surreptitious','neutralize','precede','timely','disrespectful','expulsion','extrovert','casual','circuit','flout','semester',
    'libel','morose','trait','manuscript','orthodox','barren','owl','prolific','questionnaire','neophyte','recline','coalition',
    'jettison','depression','enlarge','prolix','centenary','furtive','vengeance','discontinue','widespread','sole','compulsively','devalue',
    'physique','location','deploy','leadership','microfilm','yield','obstinate','modem','tornado','fidelity','confluence','foresee',
    'leukaemia','lava','porcelain','bully','formulation','recommendation','frantic','giggle','tile','counsel','meek','tortoise',
    'ignite','fractious','hail','subsidy','thrive','transient','blend','bacterial','kin','glossary','keystone','tighten',
    'gorge','trend','link','obdurate','balance','racket','agony','stance','assessment','arrogance','flint','percentage',
    'plummet','prostrate','torpor','picaresque','incinerate','donation','revolt','membership','vet','rave','skull','fallacy',
    'fraud','arable','dispute','staircase','jerk','outward','trench','plausible','perturb','sobriquet','stain','dichotomy',
    'perverse','shear','category','signpost','equanimity','barge','outdo','abridge','seismic','payment','critic','ennui',
    'subliminal','mercury','definitive','mechanical','excreta','defy','canvas','acrobat','swivel','decline','counterbalance','deaf',
    'compulsory','ego','disabuse','aspect','vigorous','pellucid','thorough','invaluable','exemplify','proof','shell','canteen',
    'retain','ripple','underling','extracurricular','egalitarian','agile','cacophony','hug','nylon','translucent','magma','jargon',
    'panorama','dean','habitual','wean','maternal','equivocal','cosmic','anthropology','relentless','sabotage','contrive','envision',
    'clan','thorny','liver','amicable','pervade','rectangular','cardinal','breeze','fury','efficacy','proposal','multilateral',
    'verification','onset','tendency','envy','fetid','incorporate','bud','plough','vested','situated','baron','innovative',
    'infest','vile','foreboding','audit','abbreviation','deplore','orotund','pecuniary','replicate','acid','romance','appoint',
    'poke','skip','marginal','adjunct','introvert','portable','persecute','confer','boorish','overexploit','exacerbate','population',
    'graduate','judgment','desperate','tonic','indispensable','entice','panel','consternation','flippant','exhaustive','allude','currently',
    'overlap','originate','duly','leopard','jingoism','outspoken','surveillance','stationary','vanity','seasonal','waterfront','courtship',
    'postpone','apparent','holistically','predominant','heave','signature','disposal','exploratory','anatomy','constitute','fatuous','corresponding',
    'structural','adopt','dissemble','dissatisfied','crowded','novelty','christian','guile','malinger','fahrenheit','charity','arousal',
    'sagacious','continuity','nutrition','decipher','scenario','veil','prodigious','excel','slothful','cereal','electronics','mercy',
    'hitherto','foremost','moribund','propitiate','progenitor','imagination','adaptation','migration','relocate','carton','incapacitate','enamor',
    'warranty','gravel','quaint','insinuate','handout','slum','ecology','virtuous','revenge','institute','agenda','integral',
    'medium','tempo','textile','biometrics','abide','pigment','treatment','nourish','feather','prospect','equity','union',
    'credit','quarry','finale','explicate','stark','composite','consummate','county','loll','complicated','cogent','veteran',
    'prim','anthem','aeronautics','treatise','anyhow','arcane','encase','recapture','dilate','empire','pertinacious','unbeatable',
    'ejection','glimmer','forecast','matrimony','collateral','demonstration','crucial','deleterious','graphic','flash','surf','oblique',
    'liberal','engage','steward','intelligence','commuter','exile','barrier','hospitality','tangible','tenant','intrusion','savant',
    'objection','consolation','sequence','unobtrusive','supposedly','acupuncture','transplant','pry','crisis','target','slurry','successive',
    'workforce','saturate','compatriot','hint','entail','hell','lunar','basis','fade','democracy','complexion','arthritis',
    'secretion','lofty','complicate','strenuous','mechanic','welfare','cement','transience','prerequisite','clinical','succinct','abort',
    'corpse','initiate','access','erode','migrate','facilitate','punch','invader','tragedy','introspection','contaminant','ostracize',
    'frontier','nuclear','rejoice','bulk','forfeit','digestive','diffuse','solicitous','blueprint','abolish','itinerant','vital',
    'image','amiable','consecutive','stare','deadly','arise','automatically','grandiloquent','supersede','nowhere','layoff','construction',
    'leviathan','retailer','pants','jostle','tamper','antagonism','pompous','turnover','viewpoint','soak','linear','ignominious',
    'outlook','knit','dissolve','contradict','pumice','semblance','laconic','conciliate','reassure','patio','odour','tyrannical',
    'deliver','skew','submit','numerical','crystallize','donate','perceptible','telegraph','distinctive','remorse','muscular','horrify',
    'compensation','terror','debilitate','ration','neurotic','pusillanimous','reserve','evoke','logic','endemic','corps','dizziness',
    'audible','stockpile','episode','talented','famine','nuance','global','temperament','rivet','destine','glove','warehouse',
    'portent','management','weld','lascivious','underlying','capricious','periscope','lubricate','asylum','insolvent','maltreat','estimable',
    'ridge','bereave','disingenuous','improvise','groa','rejoinder','reel','straw','marital','optional','multitude','bizarre',
    'radar','identical','teem','irrational','orientation','pore','maniac','elapse','locality','sparkle','nibble','pivotal',
    'outlying','bunch','onlooker','unanimous','optical','slack','disobey','placid','tutorial','insouciant','demur','dividend',
    'sloth','overdraft','visualize','machination','guarantee','regent','enfeeble','breakwater','integrity','foster','heretic','denigrate',
    'drastic','geology','autonomous','magnet','vehement','exuberant','euphemism','corroborate','considerate','imperil','absenteeism','luminous',
    'expand','disperse','tackle','token','fluid','imbue','evacuate','impolitic','withhold','vapid','rack','denounce',
    'fleeting','eschew','trample','patent','hawk','topple','succumb','elementary','stuntman','respective','overrun','hazard',
    'intervention','diplomatic','mythology','overweight','description','compress','enquire','sinister','definition','seduce','invest','earthworm',
    'zoological','interview','moped','eternal','illuminate','siege','baffle','illiterate','notwithstanding','ounce','manifold','unquote',
    'connive','redevelopment','implication','remittance','calibre','disharmony','elusive','trek','broom','sycophant','chant','surfeit',
    'invidious','culture','treble','droll','gallop','disdain','flora','splint','advocate','mucous','loyal','abundance',
    'monarchy','shimmer','poll','coil','addict','highway','hardware','tarnish','novice','gland','sucker','chef',
    'commotion','quotidian','qualitative','nominee','replete','whirl','ritual','clerk','denote','trinket','attenuate','nitrogen',
    'amaze','dissonant','primary','castigate','demagogue','melt','zest','loath','exhort','pave','oath','determination',
    'swear','illegal','compromise','counsellor','apprentice','herbivore','entrust','brazen','null','sanity','disparage','observation',
    'tempt','kudos','scarce','insular','debunk','punctilious','abrupt','foil','conservation','repay','regarding','vacation',
    'horticulture','encyclopedia','petroleum','imperturbable','dilatory','truculent','curse','mien','supreme','visible','helix','intestine',
    'installment','bookrest','purpose','symbolize','productivity','disparate','imitation','vernacular','brunt','profession','exculpate','linen',
    'autonomy','orient','attendance','scissors','tentative','fridge','recite','fluent','concentrate','laser','dialect','commercial',
    'jealous','variegated','economics','conundrum','hoary','distinguish','presumption','adjoin','collate','prolong','ephemeral','enervate',
    'inescapable','inscrutable','catastrophic','forum','mist','shipment','torture','penchant','conservative','predominate','abhorrent','topsoil',
    'retail','cognizant','alley','export','socialise','simulation','discomfit','allocation','courier','lime','ultimate','larceny',
    'disenchantment','restriction','conform','dietary','kidney','turf','terrestrial','generous','venerate','underwrite','impart','sententious',
    'foolhardy','condemn','thermostat','subjugate','bequeath','applicant','superstition','delicious','disclose','profile','bankruptcy','partisan',
    'scrutiny','equal','disconcerting','aggravate','quarterly','supercilious','summit','bloom','theme','prevalent','parachute','ensure',
    'refugee','navigation','conventional','rueful','intrigue','buffalo','integrate','cosmopolitan','anthropologist','impress','microbiology','countenance',
    'instrumental','periodical','deteriorate','sectional','bereft','purport','flare','volatile','transfer','distend','complication','disconsolate',
    'optimum','journal','release','overwrought','dispenser','lick','inviolable','phobia','sow','suicide','constrain','standpoint',
    'interim','enjoin','respiration','comparative','infectious','circumscribe','perpetrate','implement','flake','emulate','locomotive','underpin',
    'tram','freefone','vitality','recrimination','clockwise','cunning','frugal','household','intensive','soporific','empirical','meretricious',
    'density','glorious','supine','preferable','livestock','exhaustible','portray','converse','narrative','tourism','missile','fervent',
    'quench','transgression','inchoate','venal','vomit','inhibit','condensation','canoe','amidst','mainstream','preclude','mock',
    'cope','imitate','verbal','delectable','stringent','aisle','surgery','emollient','recruit','sentient','climatic','chill',
    'captivity','consulate','heartless','sue','mendacious','prescription','quantitative','expurgate','dormancy','lament','fake','extinct',
    'imperial','salubrious','extirpate','mendicant','hijack','disrupt','begrudge','dissident','serial','scout','fortuitous','marine',
    'magnify','chase','compunction','pit','kindergarten','mandatory','eyesight','iris','preparation','penurious','trivial','worthwhile',
    'discourteous','stripe','domain','shrug','bachelor','nonetheless','nausea','overhaul','dreary','undermine','administrative','stiff',
    'chore','consequence','superfluous','nefarious','compass','predatory','indignant','frost','motel','vindicate','defendant','tensile',
    'hedonism','assistantship','sanction','hover','biased','pierce','accredit','atlas','hermetic','chisel','exhaustion','meteorology',
    'offend','inveigh','detour','rotate','spur','rental','seminar','undulate','philosophy','taboo','flesh','ostentatious',
    'jury','glare','correspond','flatter','fixture','taut','obsolete','disable','differentiate','notorious','strengthen','elite',
    'bead','mantle','ineluctable','extemporaneous','turpitude','succession','architect','delineate','plantation','dingy','fusion','queer',
    'amateur','finesse','trapeze','prowess','personality','accessory','pathos','brood','clash','chart','stainless','pimple',
    'coordinate','customary','pine','droplet','tortuous','impervious','mission','refreshing','internist','treadmill','demand','intermittent',
    'meteoric','stereotype','external','terminate','opinion','din','preventative','victimise','forgo','angle','gamble','jejune',
    'parallel','entitle','allure','hinterland','scarcely','convenience','entreat','opulence','melancholy','perspicacious','granary','spurious',
    'hilarious','quote','leaflet','axis','inertia','phlegmatic','overture','minimum','encapsulate','weary','nobility','identifiable',
    'variability','scintilla','interior','intelligible','destiny','clumsy','indicative','stratagem','contemporary','recreational','reimburse','verdict',
    'cart','perpendicular','texture','sanctuary','handicapped','reconstruction','prohibit','diversity','perfunctory','interdependent','incongruity','resident',
    'ruffle','humidity','surrender','quota','campus','extensive','grumble','rupture','homesick','outcast','unravel','coupon',
    'precarious','robust','recession','carrot','spasm','incipient','avarice','sustainable','doom','designate','flexible','verdant',
    'guild','weed','tow','trigger','proposition','summarise','dogmatic','traitor','custodian','tear','symmetry','blast',
    'disqualify','nadir','foment','consign','comply','seclude','inexorable','metaphorical','funnel','misgiving','mingle','mischance',
    'palliate','alert','solemn','prototype','suave','memorise','valuation','utility','stable','marker','arch','geographical',
    'vituperate','poultry','contrived','erudite','gratuitous','overrate','enumerate','ore','multiply','review','sprout','underline',
    'anecdote','glamor','craven','frustrate','personalize','campaign','synthetic','stab','martyr','artery','renovation','pharmaceutical',
    'portfolio','defer','delta','bold','correspondent','loop','stimulate','suppress','odyssey','pendulum','apply','dormant',
    'bouncing','accolade','replenish','allowance','transparent','robotic','dolorous','eruption','parsimonious','consensus','divest','externally',
    'gymnasium','towel','grimy','decouple','clientele','wrought','reiterate','kneel','florid','cholesterol','delete','inception',
    'aggressive','postscript','glide','magnate','territorial','onwards','paramount','scuffle','inspiration','everlasting','presumably','sovereign',
    'treaty','exposition','epitomise','transcript','lithe','federal','download','endanger','hubris','elaboration','alleviate','amorphous',
    'vegetation','theoretical','fuss','innovation','fester','internecine','crevice','mortgage','assignment','antiseptic','entity','vanquish',
    'monitor','beneficial','cavort','winsome','incur','stagnant','instantaneous','graph','moral','convenient','pose','embed',
    'elicit','subscribe','proximity','inculcate','subtitle','strategic','document','penalize','pledge','dynamic','humanity','fountain',
    'relevance','motto','arctic','insert','detergent','germane','niggle','freak','dominate','avenge','dumb','choke',
    'interact','ally','glacial','brittle','vibrant','massive','fling','inadequate','allergic','curry','planetarium','hydrogen',
    'obfuscate','pant','coordinator','conflict','supervise','gale','abnormal','recipient','intersection','intuition','consequential','enlist',
    'debase','conclude','solidarity','haunt'
  ];

  const $ = (id) => document.getElementById(id);
  const els = {
    mapView: $('mapView'),
    termView: $('termView'),
    map: $('map'),
    mapProgress: $('mapProgress'),
    mapLegend: $('mapLegend'),
    btnContinue: $('btnContinue'),
    btnBackMap: $('btnBackMap'),
    termBody: $('termBody'),
    termTitle: $('termTitle'),
    themeToggle: $('themeToggle'),
    themeToggleMap: $('themeToggleMap'),
    btnUnlock: $('btnUnlock'),
    unlockPanel: $('unlockPanel'),
    unlockInputWord: $('unlockInputWord'),
    unlockInputNum: $('unlockInputNum'),
    unlockMsg: $('unlockMsg'),
    unlockConfirm: $('unlockConfirm'),
    unlockCancel: $('unlockCancel'),
    toast: $('toast'),
  };

  const state = {
    view: 'map',        // 'map' | 'lesson'
    mode: 'play',       // 'play' | 'review'
    lessonId: null,
    sentenceIdx: 0,
    phase: 'preview',   // 'preview' | 'input' | 'result'
    showZh: false,
    result: null,
    lastInput: '',
    progress: loadProgress(),
  };

  // 全局有序序列 + 前沿(第一个尚未通关的关)
  let GLOB = { order: [], map: {}, frontier: -1 };

  /* ============================================================
     进度存储 (localStorage)
     ============================================================ */
  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return {};
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
      const out = {};
      for (const k of Object.keys(data)) {
        if (Array.isArray(data[k])) out[k] = data[k].filter(Number.isInteger);
      }
      return out;
    } catch (e) { return {}; }
  }
  function saveProgress() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state.progress)); } catch (e) { /* ignore */ }
  }
  function resetProgress() {
    if (!window.confirm('确定要清空所有闯关进度吗？此操作不可撤销。')) return;
    state.progress = {};
    saveProgress();
    render();
    toast('进度已重置');
  }
  /* ============================================================
     句子密码（单词）& 解锁
     ============================================================ */
  function sixDigitCode(gi) {
    // 确定性「伪随机」6 位数字：乘法散列 + 异或洗牌，相邻两句数字无规律
    let x = (gi + 1) * 2654435761 >>> 0;
    x = (x ^ (x >>> 13)) >>> 0;
    return String(x % 1000000).padStart(6, '0');
  }
  function wordPassword(gi) {
    if (!WORD_POOL.length) return '';
    return WORD_POOL[gi % WORD_POOL.length];
  }
  function numberPassword(gi) {
    return sixDigitCode(gi);
  }
  function passwordFromIndex(gi) {
    return wordPassword(gi) + ' ' + numberPassword(gi);
  }
  function sentencePasswordParts(lessonId, idx) {
    const gi = GLOB.map[lessonId + ':' + idx];
    if (gi === undefined) return null;
    return { word: wordPassword(gi), num: numberPassword(gi) };
  }
  function unlockByPassword(pwd) {
    const norm = String(pwd).trim().toLowerCase().replace(/\s+/g, ' ');
    const target = GLOB.pwdMap.get(norm);
    if (!target) return null;
    for (const it of GLOB.order) {
      if (it.lessonId === target.lessonId && it.idx === target.idx) break;
      const arr = state.progress[it.lessonId] || (state.progress[it.lessonId] = []);
      if (arr.indexOf(it.idx) === -1) arr.push(it.idx);
    }
    for (const k of Object.keys(state.progress)) state.progress[k].sort((a, b) => a - b);
    saveProgress();
    recompute();
    return target;
  }
  function openUnlock() {
    els.unlockInputWord.value = '';
    els.unlockInputNum.value = '';
    els.unlockMsg.textContent = '';
    els.unlockPanel.style.display = 'flex';
    setTimeout(() => els.unlockInputWord.focus(), 0);
  }
  function closeUnlock() {
    els.unlockPanel.style.display = 'none';
  }
  function confirmUnlock() {
    const word = els.unlockInputWord.value.trim().toLowerCase();
    const num = String(els.unlockInputNum.value.trim()).replace(/\D/g, '').padStart(6, '0');
    if (!word || !num) { els.unlockMsg.textContent = '请输入完整的单词和数字密码'; return; }
    const target = unlockByPassword(word + ' ' + num);
    if (!target) { els.unlockMsg.textContent = '密码不正确'; return; }
    closeUnlock();
    state.view = 'lesson';
    state.mode = 'play';
    state.lessonId = target.lessonId;
    state.sentenceIdx = target.idx;
    state.phase = 'preview';
    state.showZh = false;
    state.result = null;
    state.lastInput = '';
    render();
    toast('已解锁到该句');
  }

  /* ============================================================
     数据访问
     ============================================================ */
  function bookData(key) {
    const manifest = DATA.manifest[key] || [];
    return manifest
      .filter((m) => DATA.lessons[`${key}-${m.n}`])
      .map((m) => DATA.lessons[`${key}-${m.n}`]);
  }
  function allBooks() {
    return DATA.levels
      .slice()
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((l) => ({ key: l.key, label: l.label, lessons: bookData(l.key) }));
  }
  function isDone(lessonId, i) { return (state.progress[lessonId] || []).indexOf(i) !== -1; }
  function markDone(lessonId, i) {
    const arr = state.progress[lessonId] || (state.progress[lessonId] = []);
    if (arr.indexOf(i) === -1) { arr.push(i); arr.sort((a, b) => a - b); saveProgress(); }
  }
  function lessonDoneCount(lesson) { return (state.progress[lesson.id] || []).length; }
  function overall() {
    let done = 0, total = 0;
    allBooks().forEach((b) => b.lessons.forEach((l) => { done += lessonDoneCount(l); total += l.text.length; }));
    return { done, total, pct: total ? Math.round(done / total * 100) : 0 };
  }

  /* ============================================================
     全局顺序 & 关卡状态 (不能跳关的核心)
     ============================================================ */
  function recompute() {
    GLOB.order = [];
    GLOB.map = {};
    GLOB.pwdMap = new Map();
    let gi = 0;
    for (const b of allBooks()) {
      for (const l of b.lessons) {
        for (let i = 0; i < l.text.length; i++) {
          const key = l.id + ':' + i;
          GLOB.map[key] = gi;
          GLOB.order.push({ lessonId: l.id, book: b.key, idx: i });
          GLOB.pwdMap.set(passwordFromIndex(gi), { lessonId: l.id, idx: i });
          gi++;
        }
      }
    }
    GLOB.frontier = GLOB.order.findIndex((it) => !isDone(it.lessonId, it.idx));
  }
  function sentenceState(lessonId, idx) {
    const k = GLOB.map[lessonId + ':' + idx];
    if (k === undefined) return 'locked';
    if (GLOB.frontier === -1) return 'done';
    if (k < GLOB.frontier) return 'done';
    if (k === GLOB.frontier) return 'current';
    return 'locked';
  }
  function lessonState(lesson) {
    let hasCurrent = false, allDone = true;
    for (let i = 0; i < lesson.text.length; i++) {
      const s = sentenceState(lesson.id, i);
      if (s === 'current') hasCurrent = true;
      if (s !== 'done') allDone = false;
    }
    if (hasCurrent) return 'active';
    if (allDone) return 'done';
    return 'locked';
  }
  function bookState(book) {
    if (!book.lessons.length) return 'empty';
    let hasActive = false, allDone = true;
    for (const l of book.lessons) {
      const s = lessonState(l);
      if (s === 'active') hasActive = true;
      if (s !== 'done') allDone = false;
    }
    if (hasActive) return 'active';
    if (allDone) return 'done';
    return 'locked';
  }
  function currentIdxInLesson(lesson) {
    for (let i = 0; i < lesson.text.length; i++) {
      if (sentenceState(lesson.id, i) === 'current') return i;
    }
    return 0;
  }

  /* ============================================================
     文本比较 (词级 diff)
     ============================================================ */
  function tokenize(s) { return String(s || '').trim().split(/\s+/).filter(Boolean); }
  function norm(w) { return w.toLowerCase().replace(/[^\w'-]+/g, ''); }
  function diff(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i--) {
      for (let j = n - 1; j >= 0; j--) {
        dp[i][j] = norm(a[i]) === norm(b[j])
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const out = [];
    let i = 0, j = 0;
    while (i < m && j < n) {
      if (norm(a[i]) === norm(b[j])) { out.push({ w: a[i], s: 'ok' }); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ w: a[i], s: 'missing' }); i++; }
      else { out.push({ w: b[j], s: 'extra' }); j++; }
    }
    while (i < m) out.push({ w: a[i++], s: 'missing' });
    while (j < n) out.push({ w: b[j++], s: 'extra' });
    return out;
  }

  /* ============================================================
     渲染工具
     ============================================================ */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }
  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.style.display = 'block';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { els.toast.style.display = 'none'; }, 1900);
  }
  function pl(inner) {
    return `<div class="cmd"><span class="prompt">nce@challenge:~$</span> ${inner}</div>`;
  }
  function cmdTitle() {
    return `<div class="cmd"><span class="prompt">nce@challenge:~$</span> nce --challenge<span class="cursor">▊</span></div>`;
  }
  function render() {
    recompute();
    if (state.view === 'map') {
      els.mapView.style.display = '';
      els.termView.style.display = 'none';
      renderMap();
    } else {
      els.mapView.style.display = 'none';
      els.termView.style.display = '';
      renderLesson();
    }
  }

  /* ============================================================
     地图视图 (星阵围棋式蜿蜒关卡地图)
     ============================================================ */
  const PAD = 16, GAP_X = 132, GAP_Y = 158, BANNER_H = 78;
  function cols() {
    const w = window.innerWidth;
    if (w >= 1100) return 6;
    if (w >= 760) return 5;
    if (w >= 520) return 4;
    return 3;
  }

  function buildMap() {
    const C = cols();
    const nodes = [], banners = [], paths = [];
    const books = allBooks().filter((b) => b.lessons.length);
    const width = C * GAP_X + PAD * 2;
    let y = 24;
    books.forEach((b) => {
      banners.push({ x: PAD, y, w: C * GAP_X, book: b, state: bookState(b) });
      y += BANNER_H;
      const centers = [];
      b.lessons.forEach((l, i) => {
        const row = Math.floor(i / C);
        const col = i % C;
        const c = row % 2 === 0 ? col : (C - 1 - col);
        const cx = PAD + (c + 0.5) * GAP_X;
        const cy = y + (row + 0.5) * GAP_Y;
        const done = lessonDoneCount(l);
        const total = l.text.length;
        centers.push({ x: cx, y: cy });
        nodes.push({ x: cx, y: cy, lesson: l, state: lessonState(l), done, total, n: l.n, pct: total ? Math.round(done / total * 100) : 0 });
      });
      if (centers.length > 1) {
        paths.push(centers.map((p, i) => (i ? 'L' : 'M') + p.x + ' ' + p.y).join(' '));
      }
      y += Math.ceil(b.lessons.length / C) * GAP_Y + 20;
    });
    return { nodes, banners, paths, width, height: y + 40 };
  }

  function renderMap() {
    const ov = overall();
    const map = buildMap();

    els.mapProgress.textContent = `总进度 ${ov.done}/${ov.total} · ${ov.pct}%`;
    els.mapLegend.innerHTML = `
      <span class="lg"><i class="lg-dot done"></i>已通关</span>
      <span class="lg"><i class="lg-dot cur"></i>进行中</span>
      <span class="lg"><i class="lg-dot locked"></i>未解锁</span>
      <span class="lg">· 一课 = 一个关卡，节点显示「已过关句子 / 总句子」</span>`;

    els.map.style.width = map.width + 'px';
    els.map.style.height = map.height + 'px';

    let html = `<svg class="map-lines" width="${map.width}" height="${map.height}" viewBox="0 0 ${map.width} ${map.height}">`;
    map.paths.forEach((p) => { html += `<path d="${p}"/>`; });
    html += `</svg>`;

    map.banners.forEach((b) => {
      const stCls = b.state === 'locked' ? 'locked' : (b.state === 'done' ? 'done' : 'active');
      const stTxt = b.state === 'locked' ? '🔒 需先通关上一册' : (b.state === 'done' ? '✓ 已通关' : '▶ 进行中');
      html += `<div class="banner ${stCls}" style="left:${b.x}px;top:${b.y}px;width:${b.w}px">`;
      html += `<span class="b-title">${esc(b.book.label)} · ${esc(b.book.key)}</span>`;
      html += `<span class="b-state">${stTxt}</span>`;
      html += `</div>`;
    });

    map.nodes.forEach((nd) => {
      const stCls = nd.state === 'locked' ? 'locked' : (nd.state === 'done' ? 'done' : 'cur');
      const stamp = nd.state === 'locked' ? '🔒' : (nd.state === 'done' ? '✓' : '▶');
      const tt = `${esc(nd.lesson.title)}${nd.lesson.titleZh ? ' · ' + esc(nd.lesson.titleZh) : ''} · 第${nd.n}课 · ${nd.done}/${nd.total}`;
      html += `<button class="lv ${stCls}" data-lesson="${nd.lesson.id}" style="left:${nd.x}px;top:${nd.y}px;--p:${nd.pct}" title="${tt}">`;
      html += `<span class="lv-ring"></span>`;
      html += `<span class="lv-num">${nd.n}</span>`;
      html += `<span class="lv-frac">${nd.done}/${nd.total}</span>`;
      html += `<span class="lv-stamp">${stamp}</span>`;
      html += `</button>`;
    });

    els.map.innerHTML = html;

    els.map.querySelectorAll('.lv[data-lesson]').forEach((el) => {
      el.addEventListener('click', () => enterLesson(el.dataset.lesson));
    });
  }

  /* ============================================================
     闯关视图 (终端 · 命令行输出流)
     ============================================================ */
  function enterLesson(lessonId) {
    const lesson = DATA.lessons[lessonId];
    if (!lesson) return;
    const st = lessonState(lesson);
    if (st === 'locked') { toast('🔒 尚未解锁，请依次闯关'); return; }
    state.view = 'lesson';
    state.mode = st === 'active' ? 'play' : 'review';
    state.lessonId = lessonId;
    state.sentenceIdx = st === 'active' ? currentIdxInLesson(lesson) : 0;
    state.phase = 'preview';
    state.showZh = true;
    state.result = null;
    state.lastInput = '';
    render();
  }

  function backToMap() {
    state.view = 'map';
    render();
  }

  function goToFrontier() {
    recompute();
    if (GLOB.frontier === -1) { backToMap(); toast('🎉 全部通关！'); return; }
    const f = GLOB.order[GLOB.frontier];
    state.view = 'lesson';
    state.mode = 'play';
    state.lessonId = f.lessonId;
    state.sentenceIdx = f.idx;
    state.phase = 'preview';
    state.showZh = true;
    state.result = null;
    state.lastInput = '';
    render();
  }

  function bookLabelOf(bookKey) {
    return (DATA.levels.find((l) => l.key === bookKey) || {}).label || bookKey;
  }

  function renderLesson() {
    if (state.mode === 'review') { renderReview(); return; }
    const lesson = DATA.lessons[state.lessonId];
    if (!lesson) { backToMap(); return; }
    const total = lesson.text.length;
    const idx = state.sentenceIdx;
    const s = lesson.text[idx];
    const bookLabel = bookLabelOf(lesson.book);

    els.termTitle.textContent = `${bookLabel} · ${String(lesson.n).padStart(2, '0')} ${lesson.title}`;

    let stepsHtml = '';
    lesson.text.forEach((_, i) => {
      const st = sentenceState(lesson.id, i);
      const cls = st === 'done' ? ' done' : (st === 'current' ? ' cur' : ' locked');
      const glyph = st === 'locked' ? '○' : '●';
      stepsHtml += `<span class="step${cls}" data-step="${i}" title="第 ${i + 1} 关${st === 'locked' ? ' · 未解锁' : ''}">${glyph}</span>`;
    });

    let html = cmdTitle();
    html += pl(`<span class="dim">第 ${idx + 1}/${total} 关 · 本课已通关 ${lessonDoneCount(lesson)}/${total}</span>`);
    {
      const p = sentencePasswordParts(lesson.id, idx);
      html += pl(`<span class="dim">本句密码：</span><span class="pwd">${p.word}</span><span class="dim"> + </span><span class="pwd">${p.num}</span>`);
    }
    html += pl(`<span class="steps">${stepsHtml}</span>`);

    if (state.phase === 'preview') {
      html += pl(`<span class="dim">原文：</span>${esc(s.en)}`);
      html += pl(`<span class="dim">译文：</span><span class="dim">${esc(s.zh)}</span>`);
      html += `<div class="actions"><button class="btn btn-primary" data-act="start">▶ 开始闯关</button></div>`;
    } else if (state.phase === 'input') {
      html += pl(`<span class="dim">原文：</span><span class="dim">[ 已隐藏 · 凭记忆输入 ]</span>`);
      html += pl(`<span class="dim">译文：</span>${state.showZh ? `<span class="dim">${esc(s.zh)}</span>` : `<span class="dim">[ 已隐藏 ]</span>`}`);
      html += `<div class="input-line"><span class="prompt">nce@challenge:~$</span><textarea class="input" id="input" rows="1" spellcheck="false" placeholder="输入原文，回车检查…">${esc(state.lastInput)}</textarea></div>`;
      html += `<div class="actions">`;
      html += `<button class="btn btn-primary" data-act="check">✔ 检查</button>`;
      html += `<button class="btn" data-act="toggleZh">${state.showZh ? '隐藏译文' : '显示译文'}</button>`;
      html += `<button class="btn" data-act="backPreview">↺ 返回预览</button>`;
      html += `</div>`;
    } else if (state.phase === 'result') {
      const pass = state.result && state.result.every((d) => d.s === 'ok');
      html += pl(`<span class="dim">你的输入：</span>${renderInputDiff()}`);
      html += pl(`<span class="dim">原文对照：</span>${renderOrigDiff()}`);
      if (pass) {
        let nextLabel;
        if (GLOB.frontier === -1) nextLabel = '🎉 全部通关';
        else if (GLOB.order[GLOB.frontier].lessonId !== lesson.id) nextLabel = '下一课 →';
        else nextLabel = '下一关 →';
        const lessonDone = lessonDoneCount(lesson) === total;
        html += `<div class="ok-line">${lessonDone ? '🎉 本课通关！' : '✔ 闯关成功！'}</div>`;
        html += `<div class="actions">`;
        html += `<button class="btn btn-primary" data-act="next">${nextLabel}</button>`;
        html += `<button class="btn" data-act="back">返回地图</button>`;
        html += `</div>`;
      } else {
        html += `<div class="bad-line">✘ 还有差异，再试一次</div>`;
        html += `<div class="actions">`;
        html += `<button class="btn btn-primary" data-act="retry">↻ 重试</button>`;
        html += `<button class="btn" data-act="peek">👁 看答案</button>`;
        html += `<button class="btn" data-act="backPreview">↺ 返回预览</button>`;
        html += `</div>`;
      }
    }

    els.termBody.innerHTML = html;
    bindLessonActions();

    const input = $('input');
    if (input) {
      const autosize = () => {
        input.style.height = 'auto';
        input.style.height = input.scrollHeight + 'px';
      };
      input.addEventListener('input', autosize);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doCheck(); }
      });
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
      requestAnimationFrame(autosize);
    }
  }

  function renderReview() {
    const lesson = DATA.lessons[state.lessonId];
    if (!lesson) { backToMap(); return; }
    const total = lesson.text.length;
    const idx = state.sentenceIdx;
    const s = lesson.text[idx];
    const bookLabel = bookLabelOf(lesson.book);

    els.termTitle.textContent = `复习 · ${bookLabel} · ${String(lesson.n).padStart(2, '0')} ${lesson.title}`;

    let stepsHtml = '';
    lesson.text.forEach((_, i) => {
      stepsHtml += `<span class="step done${i === idx ? ' cur' : ''}" data-step="${i}" title="第 ${i + 1} 句">●</span>`;
    });

    let html = cmdTitle();
    html += pl(`<span class="dim">复习 · 第 ${idx + 1}/${total} 句 · 本课已通关</span>`);
    html += pl(`<span class="steps">${stepsHtml}</span>`);
    html += pl(`<span class="dim">原文：</span>${esc(s.en)}`);
    html += pl(`<span class="dim">译文：</span><span class="dim">${esc(s.zh)}</span>`);
    {
      const p = sentencePasswordParts(lesson.id, idx);
      html += pl(`<span class="dim">本句密码：</span><span class="pwd">${p.word}</span><span class="dim"> + </span><span class="pwd">${p.num}</span>`);
    }
    html += `<div class="actions">`;
    html += `<button class="btn" data-act="prev"${idx === 0 ? ' disabled' : ''}>← 上一句</button>`;
    html += `<button class="btn" data-act="next"${idx === total - 1 ? ' disabled' : ''}>下一句 →</button>`;
    html += `<button class="btn btn-primary" data-act="back">返回地图</button>`;
    html += `</div>`;

    els.termBody.innerHTML = html;
    bindLessonActions();
  }

  function renderInputDiff() {
    if (!state.result) return '';
    const parts = state.result
      .filter((d) => d.s !== 'missing')
      .map((d) => `<span class="w ${d.s === 'ok' ? 'ok' : 'bad'}">${esc(d.w)}</span>`);
    return parts.join(' ') || '<span class="dim">(空)</span>';
  }
  function renderOrigDiff() {
    if (!state.result) return '';
    const parts = state.result
      .filter((d) => d.s !== 'extra')
      .map((d) => `<span class="w ${d.s === 'ok' ? 'ok' : 'bad'}">${esc(d.w)}</span>`);
    return parts.join(' ');
  }

  function doCheck() {
    const input = $('input');
    if (!input) return;
    state.lastInput = input.value;
    const orig = DATA.lessons[state.lessonId].text[state.sentenceIdx].en;
    state.result = diff(tokenize(orig), tokenize(state.lastInput));
    const pass = state.result.every((d) => d.s === 'ok');
    if (pass) { markDone(state.lessonId, state.sentenceIdx); recompute(); }
    state.phase = 'result';
    renderLesson();
  }

  function bindLessonActions() {
    const act = (name, fn) => {
      els.termBody.querySelectorAll(`[data-act="${name}"]`).forEach((el) => el.addEventListener('click', fn));
    };
    act('back', backToMap);
    act('start', () => { state.phase = 'input'; state.showZh = false; renderLesson(); });
    act('toggleZh', () => { state.showZh = !state.showZh; renderLesson(); });
    act('backPreview', () => { state.phase = 'preview'; state.showZh = true; renderLesson(); });
    act('check', doCheck);
    act('retry', () => { state.phase = 'input'; state.result = null; state.lastInput = ''; renderLesson(); });
    act('peek', () => { state.phase = 'preview'; state.showZh = true; state.lastInput = ''; renderLesson(); });
    act('next', () => { state.mode === 'review' ? reviewNav(1) : goToFrontier(); });
    act('prev', () => reviewNav(-1));

    els.termBody.querySelectorAll('.step[data-step]').forEach((el) => {
      el.addEventListener('click', () => {
        const i = parseInt(el.dataset.step, 10);
        const st = sentenceState(state.lessonId, i);
        if (st === 'locked') { toast('🔒 该关尚未解锁，请依次闯关'); return; }
        state.sentenceIdx = i;
        state.phase = 'preview';
        state.showZh = true;
        state.result = null;
        state.lastInput = '';
        renderLesson();
      });
    });
  }

  function reviewNav(dir) {
    const total = DATA.lessons[state.lessonId].text.length;
    const n = state.sentenceIdx + dir;
    if (n < 0 || n >= total) return;
    state.sentenceIdx = n;
    renderLesson();
  }

  /* ============================================================
     主题 (全局黑白切换)
     ============================================================ */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const label = theme === 'dark' ? '☀' : '🌙';
    const title = theme === 'dark' ? '切换到白底' : '切换到黑底';
    [els.themeToggle, els.themeToggleMap].forEach((b) => {
      if (b) { b.textContent = label; b.title = title; }
    });
    try { localStorage.setItem('nce-challenge-theme', theme); } catch (e) { /* ignore */ }
  }

  /* ============================================================
     init
     ============================================================ */
  function init() {
    applyTheme(localStorage.getItem('nce-challenge-theme') || 'dark');
    const toggleTheme = () => {
      applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    };
    els.themeToggle.addEventListener('click', toggleTheme);
    els.themeToggleMap.addEventListener('click', toggleTheme);
    els.btnBackMap.addEventListener('click', backToMap);
    els.btnContinue.addEventListener('click', goToFrontier);
    els.btnUnlock.addEventListener('click', openUnlock);
    els.unlockConfirm.addEventListener('click', confirmUnlock);
    els.unlockCancel.addEventListener('click', closeUnlock);
    els.unlockInputWord.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); confirmUnlock(); }
    });
    els.unlockInputNum.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); confirmUnlock(); }
    });
    window.addEventListener('resize', () => { if (state.view === 'map') renderMap(); });
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
