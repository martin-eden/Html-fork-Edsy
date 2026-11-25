/*
EDSY was created using assets and imagery from Elite Dangerous, with the permission of Frontier Developments plc, for non-commercial purposes.
It is not endorsed by nor reflects the views or opinions of Frontier Developments and no employee of Frontier Developments was involved in the making of it.

Except where noted otherwise, all design, markup and script code for EDSY is copyright (c) 2015-2024 taleden
and is provided under a Creative Commons Attribution-NonCommercial 4.0 International License (http://creativecommons.org/licenses/by-nc/4.0/).

The Elite Dangerous game logic and data in this file remains the property of Frontier Developments plc, and is used here as authorized by
Frontier Customer Services (https://forums.frontier.co.uk/threads/elite-dangerous-media-usage-rules.510879/).
*/
'use strict';
window.edsy = new (function() {
	var VERSIONS = [424019901,424019901,424029901,424029901]; /* HTML,CSS,DB,JS */
	var LASTMODIFIED = 20261020;

	var EMPTY_OBJ = {};
	var EMPTY_ARR = [];
	var EXPERIMENTAL_IMPORT = {};
	var TIMEOUT_RESIZE = 300;
	var TIMEOUT_DBLCLICK = 300;
	var TIMEOUT_LONGPRESS = 500;
	var TOLERANCE_TOUCH = 10;
	var WEAPON_CHARGE = 0.0;
	var GROUPS = ['hardpoint','utility','component','military','internal'];
	var CORE_SLOT_FDNAME = ['Armour', 'PowerPlant', 'MainEngines', 'FrameShiftDrive', 'LifeSupport', 'PowerDistributor', 'Radar', 'FuelTank'];
	var CORE_SLOT_ABBR = ['BH','PP','TH','FD','LS','PD','SS','FT'];
	var CORE_ABBR_SLOT = { BH:0,PP:1,TH:2,FD:3,LS:4,PD:5,SS:6,FT:7,
															RB:1,TM:2,FH:3,EC:4,PC:5,     FS:7 };
	var BOOST_MARGIN = 0;
	var SHIP_HATCH_ID = 49180;
	var MAX_SLOT_CLASS = 8;
	var MAX_POWER_DIST = 8;
	var TOTAL_POWER_DIST = 12;
	var MAX_POWER_PRIORITY = 5;
	var MAX_BLUEPRINT_GRADE = 5;
	var MAX_DAMAGED_PWRCAP = 0.5;
	var MAX_MALFUNCTION_PWRCAP = 0.4;
	var MIN_MODIFIER = 0.00005;
	var MIN_BPROLL = 0.00025;
//  var BPGRADE_PROGRESS = [0.99, 0.99, 0.65, 0.5, 0.35, 0.25];
	var BPROLL_UPGRADE = 0.8;
//  var BPROLL_LIMIT = 0.95;
	var DISCOUNTS = [30,20,15,10,5,2.5];
	var HASH_VERSION = 20;
	var ICON_MOUNT = { F:'fixed', G:'gimballed', T:'turreted' };
	var ICON_MISSILE = { D:'dumbfire', S:'seeker' };
	var ICON_TAG = { C:'community', G:'guardian', M:'merc', P:'powerplay', T:'techbroker' };
	var CSS_FONTS = ['caps','text','fixed'];
	var CSS_COLORS = ['orange','red','blue','green','yellow'];
	var BUILTIN_STORED_MODULES = {
		811410 : { name:"1D/F Abrasion Blaster, LR",             modulehash:"JJprG-ZG0062y006y00Ey00Iy00L800P800",             tag:'C' }, // CG reward
		811411 : { name:"1D/F Abrasion Blaster, \"Far Reaching\"",modulehash:"JJprG-aG_W56q00Eq00IkPcKwPcQyez",                tag:'M' }, // merccoin
		862500 : { name:"2E/FD AX Missile, HC+RF",               modulehash:"JL3gG-ZG0090zcQ4sPcAhhXEsPcIupDL000P000UxCpWy00", tag:'T' }, // Sirius tech broker
		863300 : { name:"3C/FD AX Missile, HC+RF",               modulehash:"JL4wG-ZG0090zcQ4sPcAhhXEsPcIupDL000P000UxCpWy00", tag:'T' }, // Sirius tech broker
		604100 : { name:"4A/F Beam Laser, \"Overloaded\"",       modulehash:"JElwG-mG_W50y008q00CoPcGu00Ko58",                 tag:'M' }, // merccoin
		612610 : { name:"2F/G Burst Laser, \"Regenerative\"",    modulehash:"JEzDG-qR_W68kPcCj7iGqQeSoPcYgPckxZL",             tag:'M' }, // merccoin
		704200 : { name:"4B/F Cannon, \"Force Impact\"",         modulehash:"JHCKG-oL_W90u008qpDEvcQGoPcWrLDarLLelR9vMG0zMG0", tag:'M' }, // merccoin
		862570 : { name:"2E/G EAXMC \"Azimuth\", OC, AL",        modulehash:"JL3nG-ZH0038_00CoPcL600",                         tag:'T' }, // Azimuth / Rescue Ship tech broker
		863370 : { name:"3C/G EAXMC \"Azimuth\", OC, AL",        modulehash:"JL51G-ZH0038_00CoPcL600",                         tag:'T' }, // Azimuth / Rescue Ship tech broker
		872200 : { name:"2B Enzyme Missile, HC+Caustic",         modulehash:"JLIqG-ZG0050ypD4sPc8y00C_00Gu00",                 tag:'C' }, // CG reward
		872201 : { name:"2B Enzyme Missile, \"High-Yield\"",     modulehash:"JLIqG-iG_W50qpD4kPc8kPcCq00Ge69",                 tag:'M' }, // merccoin
		711510 : { name:"1E/G Frag Cannon, DS+HC, SS",           modulehash:"JHNlG-ZP0080ypD8sPcUoPcYlhXb400f2ghizR1vF00",     tag:'C' }, // CG reward
		711511 : { name:"1E/G Frag Cannon, \"Double Screaming\"",modulehash:"JHNlG-mP_W70qpD8kPcUgPcb400evLLimGpv1cQ",         tag:'M' }, // merccoin
		713310 : { name:"3C/G Frag Cannon, DS+HC, SS",           modulehash:"JHQZG-ZP0080ypD8sPcUoPcYlhXb400f2ghizR1vF00",     tag:'C' }, // CG reward
		713311 : { name:"3C/G Frag Cannon, \"Double Screaming\"",modulehash:"JHQZG-mP_W70qpD8kPcUgPcb400evLLimGpv1cQ",         tag:'M' }, // merccoin
		881400 : { name:"1D/F Grd Gauss, RF+HC",                 modulehash:"JLXCG-YG0092_166_00A_00Ew7ZHD00L800P600T800YsPc", tag:'T' }, // Salvation tech broker
		882200 : { name:"2B/F Grd Gauss, RF+HC",                 modulehash:"JLYSG-YG0092_166_00A_00Ew7ZHD00L800P600T800YsPc", tag:'T' }, // Salvation tech broker
		881430 : { name:"1D/F Grd Plasma, OC+Foc",               modulehash:"JLXFG-YG0060vBh4zHx8y00Cw00H800KvLL",             tag:'T' }, // Salvation tech broker
		882230 : { name:"2B/F Grd Plasma, OC+Foc",               modulehash:"JLYVG-YG0060vBh4zHx8y00Cw00H800KvLL",             tag:'T' }, // Salvation tech broker
		881460 : { name:"1D/F Grd Shard, LR+Foc, Pen",           modulehash:"JLXIG-YG0090y0051Cp98HkDFm0H058K_7YP4JAV700YpXv", tag:'T' }, // Salvation tech broker
		882160 : { name:"2A/F Grd Shard, LR+Foc, Pen",           modulehash:"JLYOG-YG0090y0051Cp98HkDFm0H058K_7YP4JAV700YpXv", tag:'T' }, // Salvation tech broker
		882161 : { name:"2A/F Grd Shard, LR5+Foc",               modulehash:"JLYOG-ZG0080y0051Cp993DDFm0H058L800Op77V700",     tag:'C' }, // CG reward
		811400 : { name:"1D/F Mining Laser, LR, Incen",          modulehash:"JJpqG-ZH0072y006y00AkPcEy00I_ezL800PBLL",         tag:'T' }, // Torval Mining Ltd tech broker
		811401 : { name:"1D/F Mining Laser, \"Long Range\"",     modulehash:"JJpqG-cH_W72q006kPcAkPcEkPcInJ_KwPcQupD",         tag:'M' }, // merccoin
		722500 : { name:"2E/F Multi-cannon, RF+HC, Phasing",     modulehash:"JHewG-iS007Uy00Yuaab600f466n600soPcv400",         tag:'C' }, // CG reward
		722501 : { name:"2E/F Multi-cannon, \"Rapid Phase\"",    modulehash:"JHewG-oS_W6Uq00YmYqaupDesZ1m_00s_lN",             tag:'M' }, // merccoin
		842200 : { name:"2B/F Rail, HC+LR, FeedCas",             modulehash:"JKZyG-ZI0080-Cp8zCpT000Yyv4b000f000iu00r900",     tag:'C' }, // CG reward
		842201 : { name:"2B/F Rail, \"Enduring Feedback\"",      modulehash:"JKZyG-iI_W90tCp8naNCraNKypDSoPcYoPceoPcilxwqv7i", tag:'M' }, // merccoin
		842240 : { name:"2B/F Imperial Hammer, HC, SupPen",      modulehash:"JKa0G-ZP0060zcQ8u00EsPcYuDrb000f000",             tag:'C' }, // CG reward

	//  862280 : { name:"2B/T Flak, Green",                      modulehash:"JL3KG-bG_W1A-wu",                                 tag:'T' }, // tech broker?
	//  862281 : { name:"2B/T Flak, Pink",                       modulehash:"JL3KG-dG_W1A-wu",                                 tag:'T' }, // tech broker?
	//  862282 : { name:"2B/T Flak, Red",                        modulehash:"JL3KG-fG_W1A-wu",                                 tag:'T' }, // tech broker?
	//  862283 : { name:"2B/T Flak, Yellow",                     modulehash:"JL3KG-hG_W1A-wu",                                 tag:'T' }, // tech broker?
		822230 : { name:"2B Seeker \"V1\", HC+LW, ThmCas",       modulehash:"JK4lG-ZQ0072-Cp6ypDAsPcIwPcUoPcX000b000",         tag:'T' }, // human tech broker
		822234 : { name:"2B Seeker, \"Lightweight Thermal\"",    modulehash:"JK4lG-iQ0072nmf6qpDAf7iIj7iUb4SWrLLal77",         tag:'M' }, // merccoin
		822231 : { name:"2B Seeker, HC+RF, Drag",                modulehash:"HK4lG-2R00612008u00GwghUsPcX400b400",             tag:'C' }, // CG reward // TODO: get sample to test import
		822232 : { name:"2B Seeker, HC+Std, FSDInt",             modulehash:"JK4lG-ZK00910pD50008upDCvcQMoPcOwPcUoPcX000b000", tag:'C' }, // CG reward
		822233 : { name:"2B Seeker, \"Drag\"",                   modulehash:"JK4lG-gR0060w008m00Gof-Uf1GWvLLarLQ",             tag:'M' }, // merccoin
		822235 : { name:"2B Seeker, \"Lockdown\"",               modulehash:"JK4lG-kK_W90upD4oPc8mpDCiUkMb7iOj7iUb7iWrLLanJ_", tag:'M' }, // merccoin
		823132 : { name:"3A Seeker, HC+Std, FSDInt",             modulehash:"JK69G-ZK00910pD50008upDCvcQMoPcOwPcUoPcX000b000", tag:'C' }, // CG reward
		823136 : { name:"3A Seeker, \"Exposing\"",               modulehash:"JK69G-mR_W80vcQ8q00Ej7iL0AFUiUkWrLLalAmgkPc",     tag:'M' }, // merccoin
		823135 : { name:"3A Seeker, \"Lockdown\"",               modulehash:"JK69G-kK_W90upD4oPc8mpDCiUkMb7iOj7iUb7iWrLLanJ_", tag:'M' }, // merccoin

		510600 : { name:"0F ECM, LW+Shd",                        modulehash:"FCTqG03G0032_pD50009000",                         tag:'C' }, // CG reward // TODO: get sample to test import
		520900 : { name:"0I Heat Sink, ACx2",                    modulehash:"JCjwG-YG002P000S_00",                             tag:'T' }, // Sirus tech broker
		570100 : { name:"0A KWS, FS+LR",                         modulehash:"JDwoG-ZG0056y008y00GzCpMupDQ_Pc",                 tag:'C' }, // CG reward
		570300 : { name:"0C KWS, FS+LR",                         modulehash:"JDx6G-ZG0056y008y00GzCpMupDQ_Pc",                 tag:'C' }, // CG reward
		530900 : { name:"0I/T Point Defence, LW+Foc",            modulehash:"JCzYG-bG0042_pD6y00GkPcL000",                     tag:'C' }, // CG reward

		453100 : { name:"3A Power Dist, SF+EF",                  modulehash:"JB3_G-hG006Iu00MsPcOxCpSwPcWxCpawPc",             tag:'C' }, // CG reward
		453101 : { name:"3A Power Dist, \"Support\"",            modulehash:"JB3_G-oG_W6Il-CMkPcOjmfSj7iWjmfaj7i",             tag:'M' }, // merccoin
		453400 : { name:"3D Power Dist, SF+EF",                  modulehash:"JB4SG-hG006Iu00MsPcOxCpSwPcWxCpawPc",             tag:'C' }, // CG reward
		453401 : { name:"3D Power Dist, \"Support\"",            modulehash:"JB4SG-oG_W6Il-CMkPcOjmfSj7iWjmfaj7i",             tag:'M' }, // merccoin
		454100 : { name:"4A Power Dist, SF+EF",                  modulehash:"JB5YG-hG006Iu00MsPcOxCpSwPcWxCpawPc",             tag:'C' }, // CG reward
		454101 : { name:"4A Power Dist, \"Support\"",            modulehash:"JB5YG-oG_W6Il-CMkPcOjmfSj7iWjmfaj7i",             tag:'M' }, // merccoin
		454400 : { name:"4D Power Dist, SF+EF",                  modulehash:"JB60G-hG006Iu00MsPcOxCpSwPcWxCpawPc",             tag:'C' }, // CG reward
		454401 : { name:"4D Power Dist, \"Support\"",            modulehash:"JB60G-oG_W6Il-CMkPcOjmfSj7iWjmfaj7i",             tag:'M' }, // merccoin
		455101 : { name:"5A Power Dist, \"Balanced\"",           modulehash:"JB76G-mG_W90gPc6c9EAb7iGfO4KfurOfO4SfurWfO4afur", tag:'M' }, // merccoin
		456100 : { name:"6A Power Dist, SF+EF",                  modulehash:"JB8gG-hG006Iu00MsPcOxCpSwPcWxCpawPc",             tag:'C' }, // CG reward
		456101 : { name:"6A Power Dist, \"Support\"",            modulehash:"JB8gG-oG_W6Il-CMkPcOjmfSj7iWjmfaj7i",             tag:'M' }, // merccoin
		413100 : { name:"3A Power Plant, AR+OC",                 modulehash:"JA5UG-ZG0040sPc4-cQ8yAFCqAF",                     tag:'C' }, // CG reward
		413101 : { name:"3A Power Plant, OCx2",                  modulehash:"JA5UG-dG0036upD8ypDCvcQ",                         tag:'C' }, // CG reward
		414101 : { name:"4A Power Plant, OCx2",                  modulehash:"JA72G-dG0036upD8ypDCvcQ",                         tag:'C' }, // CG reward
		415101 : { name:"5A Power Plant, OCx2",                  modulehash:"JA8cG-dG0036ur88ypDCvcQ",                         tag:'C' }, // CG reward
		433100 : { name:"3A FSD \"V1\", IR+FB",                  modulehash:"JAakG-bG0060upD6upD8qpDE_PcGzcQKsPc",             tag:'C' }, // CG reward
		434100 : { name:"4A FSD \"V1\", IR+FB",                  modulehash:"JAcIG-bG0060upD6upD8qpDE_PcGzcQKsPc",             tag:'C' }, // CG reward
		435100 : { name:"5A FSD \"V1\", IR+FB",                  modulehash:"JAdsG-bG0060upD6upD8qpDE_PcGzcQKsPc",             tag:'T' }, // human tech broker
		436100 : { name:"6A FSD \"V1\", IR+FB",                  modulehash:"JAfQG-bG0060upD6upD8qpDE_PcGzcQKsPc",             tag:'C' }, // CG reward
		432110 : { name:"2A SCO \"V1\", IR+FB",                  modulehash:"JAZBG-bG0060upD6upD8qpDE_PcGzcQKsPc",             tag:'T' }, // CG reward / human tech broker
		433110 : { name:"3A SCO \"V1\", IR+FB",                  modulehash:"JAalG-bG0060upD6upD8qpDE_PcGzcQKsPc",             tag:'T' }, // CG reward / human tech broker
		434110 : { name:"4A SCO \"V1\", IR+FB",                  modulehash:"JAcJG-bG0060upD6upD8qpDE_PcGzcQKsPc",             tag:'T' }, // CG reward / human tech broker
		435110 : { name:"5A SCO \"V1\", IR+FB",                  modulehash:"JAdtG-bG0060upD6upD8qpDE_PcGzcQKsPc",             tag:'T' }, // CG reward / human tech broker
		436110 : { name:"6A SCO \"V1\", IR+FB",                  modulehash:"JAfRG-bG0060upD6upD8qpDE_PcGzcQKsPc",             tag:'T' }, // CG reward / human tech broker
		437110 : { name:"7A SCO \"V1\", IR+FB",                  modulehash:"JAg-G-bG0060upD6upD8qpDE_PcGzcQKsPc",             tag:'T' }, // CG reward / human tech broker

			5510 : { name:"5E Anti-Corrosion Cargo (Cap: 32)",     modulehash:"H08d00",                                          tag:'C' }, // CG reward
			6510 : { name:"6E Anti-Corrosion Cargo (Cap: 64)",     modulehash:"H0AB00",                                          tag:'C' }, // CG reward

			5500 : { name:"5E Cargo Rack, ECR (Cap: 43)",          modulehash:"J08cG-ZG0010vW0",                                 tag:'C' }, // CG reward
			5501 : { name:"5E Cargo Rack, \"Extended\" (Cap: 33)", modulehash:"J08cG-aG_W10hxw",                                 tag:'M' }, // merccoin
			6500 : { name:"6E Cargo Rack, ECR (Cap: 86)",          modulehash:"J0AAG-ZG0010vW0",                                 tag:'C' }, // CG reward
			6501 : { name:"6E Cargo Rack, \"Extended\" (Cap: 66)", modulehash:"J0AAG-aG_W10hxw",                                 tag:'M' }, // merccoin

		 85400 : { name:"5D Module Reinforcement, \"Heavy Duty\"",modulehash:"J25SG-aG_W30u004gPc8gPc",                        tag:'M' }, // merccoin

		111300 : { name:"1I DSS \"V1\", ERx2",                   modulehash:"J2jwG-fG001P000",                                 tag:'T' }, // human tech broker
		111301 : { name:"1I DSS, \"Long Range\"",                modulehash:"J2jwG-gG_W1OoPc",                                 tag:'M' }, // merccoin

		303100 : { name:"3A Shield Gen, KR+TR",                  modulehash:"J7PcG-bG0044sPc8wPccupDgvcQ",                     tag:'C' }, // CG reward
	};
	var LANG_NAMES = { // TODO cn? ko? nl? pl?
		"en": "English",
	};
	var LANGS = Object.keys(LANG_NAMES);
	var LANG_DEFAULT = 'en';

	var UNIT_ABBR_TRANSLATIONS = {
		"%": "unit-percent-abbr",
		"&deg;": "unit-degrees-abbr",
		"&deg;/s": "unit-degrees-per-second-abbr",
		"Cr": "unit-credits-abbr",
		"Cr/T": "unit-credits-per-ton-abbr",
		"KM": "unit-kilometers-abbr",
		"LS": "unit-lightseconds-abbr",
		"LY": "unit-lightyears-abbr",
		"M": "unit-meters-abbr",
		"M/s": "unit-meters-per-second-abbr",
		"MJ/s": "unit-megajoules-per-second",
		"MW": "unit-megawatts-abbr",
		"MW/s": "unit-megawatts-per-second-abbr",
		"/MW": "unit-per-megawatt-abbr",
		"T": "unit-tons-abbr",
		"T/s": "unit-tons-per-second-abbr",
		"h": "unit-hours-abbr",
		"m": "unit-minutes-abbr",
		"s": "unit-seconds-abbr",
		"/s": "unit-per-second-abbr",
		"x": "unit-multiplier-abbr",
	};

	var cache = {
		reEscapeHTML: new RegExp('[&<>"\'/°]', 'g'),
		fnEscapeHTML: function(m) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&apos;','/':'&sol;','°':'&deg;'}[m] || m; },
		attribute: {},
		formatNumText: {},
		formatPctText: {},
		reSpacePercent: new RegExp('[ \u00A0]+(%)'),
		parseNumText: null,
		feature: {},
		ships: [],
		shipBuild: {},
		shipHash: {},
		shipModules: {},
		groupMtypes: {},
		mtypeModules: {},
		mtypeBuiltins: {},
		mtypeSizeGaps: {},
		mtypeBlueprints: {},
		mtypeExpeffects: {},
		moduleHash: {},
		hashVersionMap: {},
		discountMod: {},
		discounts: [],
		option: {},
		template: {},
		icon: {},
		lang: null,
		translation: {},
		translationDefault: null,
		reTranslationValue: new RegExp('\{([A-Za-z0-9_-]+)\}', 'g'),
	};
	var current = {
		dev: false,
		beta: false,
		locale: undefined,
		lang: LANG_DEFAULT,
		popup: {
			element: null,
			trigger: null,
			refocus: null,
			sticky: null,
			onOkay: null,
			onCancel: null,
		},
		importdata: {
			imports: null,
			buildlist: null,
			modules: null,
		},
		drag: null,
		resize: null,
		query: null,
		pickerClick: {},
		pickerTouch: {},
		slotsClick: {},
		slotsTouch: {},
		bprollClick: {},
		bprollTouch: {},
		importLabel: {},
		labelImports: {},
		stored: {
			shipNamehashStored: { 0:{} },
			shipStoreds: { 0:[] },
			moduleNamehashStored: { 0:{} },
			moduleStoreds: { 0:[] },
			modulehashStored: {},
		},
		pickerNameNamehash: {},
		option: {
			insurance: 9500,
			discounts: 0,
			builtin: 'some',
			onlybest: 'none',
			revsize: false,
			revrating: false,
			experimental: false,
			show1: true,
			show2: true,
			show3: true,
			hidestats: true,
			// fonts generated from CSS_FONTS
			// colors generated from CSS_COLORS
			language: '',
		},
		page: null,
		shipyard_tab: null,
		tab: null,
		fit: null,
		outfitting_onecol: false,
		outfitting_focus: null,
		outfitting_mode: null,
		outfitting_show1: null,
		outfitting_show2a: null,
		outfitting_show2b: null,
		pickerSlot: null,
		tempSlot: null,
		group: null,
		slot: null,
		tableSort: {
			shipyard_ships_table: {},
			shipyard_storedbuilds_table: {},
		},
		counter: {}
	};


	var
		LN2 = Math.LN2,
		LN10 = Math.LN10,
		PI = Math.PI,
		abs = Math.abs,
		atan2 = Math.atan2,
		ceil = Math.ceil,
		exp = Math.exp,
		floor = Math.floor,
		log = Math.log,
		log2 = Math.log2,
		max = Math.max,
		min = Math.min,
		pow = Math.pow,
		random = Math.random,
		round = Math.round,
		sign = Math.sign,
		sqrt = Math.sqrt
	;
	var
		atanh = Math.atanh || function(x) {
			return (log((1 + x) / (1 - x)) / 2);
		},
		tanh = Math.tanh || function(x) {
			var a = exp(+x), b = exp(-x);
			return ((a == Infinity) ? 1 : ((b == Infinity) ? -1 : ((a - b) / (a + b))));
		},
		clone = Object.assign || function(tgt, src) {
			if (src) {
				for (var key in src) {
					if (src.hasOwnProperty(key)) {
						tgt[key] = src[key];
					}
				}
			}
			return tgt;
		},
		contains = function(lst, itm) {
			var i = lst.length;
			while (i-- > 0) {
				if (lst[i] === itm)
					return true;
			}
			return false;
		}
	;


	/*
	* UTILITY FUNCTIONS
	*/


	var setDOMSelectLength = function(select, length) {
		while (select.length < length)
			select.options.add(document.createElement('option'));
		while (select.length > length)
			select.options.remove(select.options.length - 1);
	}; // setDOMSelectLength()


	var populateDOMSelectStoreds = function(select, storeds, namehash, offset) {
		var selectedIndex = (select.selectedIndex ? -1 : 0);
		storeds = storeds || EMPTY_ARR;
		offset = offset || 0;
		setDOMSelectLength(select, offset + storeds.length);
		for (var i = 0;  i < storeds.length;  i++) {
			select.options[offset+i].value = storeds[i].namehash;
			select.options[offset+i].text = storeds[i].name;
			if (storeds[i].namehash === namehash)
				selectedIndex = offset+i;
		}
		select.selectedIndex = selectedIndex;
		return true;
	}; // populateDOMSelectStoreds()


	var setClipboardString = function(string) {
		var el = document.createElement('textarea');
		el.value = string;
		el.setAttribute('readonly', '');
		el.style.position = 'absolute';
		el.style.left = '-1000px';
		document.body.appendChild(el);
		el.focus();
		el.select();
		var ok = true;
		try {
			document.execCommand('copy');
		} catch (exc) {
			ok = false;
		}
		document.body.removeChild(el);
		return ok;
	}; // setClipboardString()


	var isDropEffectCopy = function(e) {
		// Fixes browser bug in Chrome on Windows where dropEffect is always "none".
		// The original bug report [1] was merged into another issue [2] but that
		// issue was made private or something because I get permission denied when
		// trying to view it.
		//
		// The fix is to wrap the retrieval of the drop effect and use the current
		// event to determine what the drop effect is.
		//
		// [1]: https://bugs.chromium.org/p/chromium/issues/detail?id=501655
		// [2]: https://bugs.chromium.org/p/chromium/issues/detail?id=39399

		if (e.dataTransfer.dropEffect !== 'none') {
			// Bug hasn't been hit because a drop effect was detected.
			return e.dataTransfer.dropEffect;
		}

		if (e.dataTransfer.effectAllowed !== 'copyMove') {
			// Should never happen. We should only be using this function when we're
			// expecting a copy or move drop event. effectAllowed should have been
			// set when the drag started.
			console.warn('Using isDropEffectCopy() but effectAllowed is not copyMove! (effectAllowed=' + e.dataTransfer.effectAllowed + ')');
			return e.dataTransfer.effectAllowed;
		}

		// This is the actual fix.
		return !!e.ctrlKey;
	} // isDropEffectCopy()


	var encodeHTML = function(text) {
		return text.replaceAll(cache.reEscapeHTML, cache.fnEscapeHTML);
	}; // encodeHTML()


	var getCookie = function(name, defaultvalue) {
		return ((document.cookie.match(new RegExp('(?:^|;)\\s*' + name + '\\s*=\\s*"?([^"\\s;]*)"?\\s*(?:;|$)')) || EMPTY_ARR)[1] || defaultvalue);
	}; // getCookie()


	var createIcon = function(icon) {
		return (cache.icon[icon] || cache.icon['unknown'] || document.createTextNode('?')).cloneNode(true);
	}; // createIcon()


	/* TODO not needed?
	var appendTextLines = function(el, text, lines) {
		lines = lines || ceil(text.length / 80);
		while (lines > 1) {
			var i = (text.length / lines) | 0;
			for (var j = 0;  j <= i;  j++) {
				if (text[i+j] == ' ') {
					el.append(text.slice(0, i+j), document.createElement('br'));
					text = text.slice(i+j+1);
					break;
				} else if (text[i-j] == ' ') {
					el.append(text.slice(0, i-j), document.createElement('br'));
					text = text.slice(i-j+1);
					break;
				}
			}
			lines--;
		}
		el.append(text);
	}; // appendTextLines()
	*/

	var formatNumText = ((window.Intl && window.Intl.NumberFormat)
		? (
			function(num, dec) {
				return (cache.formatNumText[dec] || (
					cache.formatNumText[dec] = (new window.Intl.NumberFormat(current.locale, { style:'decimal', useGrouping:true,  minimumIntegerDigits:1, minimumFractionDigits:dec, maximumFractionDigits:dec })).format
				))(num);
			}
		) : (
			function(num, dec) {
				if (!isFinite(num))
					return n.toFixed(dec);
				var parts = num.toFixed(dec).split('.');
				var o = '';
				var s = parts[0];
				var i = L = s.length;
				while (i-- > 0)
					o = ((i && !((L - i) % 3)) ? ',' : '') + s[i] + o;
				return o + (dec ? ('.' + parts[1]) : '');
			}
		)
	); // formatNumText()


	var parseNumText = function(text) {
		if (!cache.parseNumText) {
			if (window.Intl && window.Intl.NumberFormat) {
				// based on Mike Bostock's solution: https://observablehq.com/@mbostock/localized-number-parsing
				var parts = (new window.Intl.NumberFormat(current.locale, {useGrouping:true, minimumIntegerDigits:10, minimumFractionDigits:1})).formatToParts(123456789);
				var n = 0, map = {};
				for (var p = 0;  p < parts.length;  p++) {
					switch (parts[p].type) {
					case 'integer':  for (var i = 0;  i < parts[p].value.length;  i++) map[parts[p].value[i]] = n++;  break;
					case 'group':    map[parts[p].value] = "";   break;
					case 'decimal':  map[parts[p].value] = ".";  break;
					}
				}
				var search = new RegExp('[' + Object.keys(map).join('').replace(/([\.\(\)\[\]\-])/g,'\\$1') + ']', 'g');
				cache.parseNumText = function(text) {
					return (text = text.trim().replace(search, function(s) { return map[s]; })) ? parseFloat(text) : NaN
				};
			} else {
				var sep = formatNumText(1.2,1).substring(1,2);
				var reDecimalSep = new RegExp('\\' + sep);
				sep = formatNumText(111111111,0).replace(new RegExp(formatNumText(1,0),'g'),'')[0];
				var reThousandSep = sep ? (new RegExp('\\' + sep, 'g')) : null;
				cache.parseNumText = function(text) {
					if (reThousandSep)
						text = text.replace(reThousandSep, '');
					return parseFloat(text.replace(reDecimalSep, '.').trim());
				}
			}
		}
		return cache.parseNumText(text);
	}; // parseNumText()


	var formatPctText = ((window.Intl && window.Intl.NumberFormat)
		? (
			function(num, dec) {
				return (cache.formatPctText[dec] || (
					cache.formatPctText[dec] = (new window.Intl.NumberFormat(current.locale, { style:'percent', useGrouping:false,  minimumIntegerDigits:1, minimumFractionDigits:dec, maximumFractionDigits:dec })).format
				))(num).replace(cache.reSpacePercent, '$1');
			}
		) : (
			function(num, dec) {
				return (num * 100).toFixed(0) + '%';
			}
		)
	); // formatPctText()


	var formatNumHTML = function(num, dec) {
		if (num === undefined)
			return '';
		var vals = {'number':num, 'number#':dec, 'number!':(isNaN(num) ? 0 : (isFinite(num) ? undefined : ((num < 0) ? -1 : 1)))};
		var text = ((isFinite(num) || isNaN(num)) ? formatNumText(((num === num) ? num : 0), dec) : '&infin;');
		if (num !== num)
			text = text.replace(/0/g,'?');
		var html = '<span'
			+ ' edsy-vals="' + encodeHTML(JSON.stringify(vals)) + '"'
			+ ' edsy-text="interp-number"'
			+ '>' + text + '</span>';
		if (num !== num)
			html = '<abbr class="unknown" edsy-title="unknown" title="Unknown!">' + html + '</abbr>';
		return html;
	}; // formatNumHTML()


	var formatPctHTML = function(num, dec) {
		if (num === undefined)
			return '';
		var vals = {'number':num, 'number#':dec, 'number%':true, 'number!':(isNaN(num) ? 0 : (isFinite(num) ? undefined : ((num < 0) ? -1 : 1)))};
		var text = ((isFinite(num) || isNaN(num)) ? formatPctText(((num === num) ? num : 0), dec).replace('%', '<small class="semantic">%</small>') : '&infin;');
		if (num !== num)
			text = text.replace(/0/g,'?');
		var html = '<span'
			+ ' edsy-vals="' + encodeHTML(JSON.stringify(vals)) + '"'
			+ ' edsy-text="interp-number"'
			+ '>' + text + '</span>';
		if (num !== num)
			html = '<abbr class="unknown" edsy-title="unknown" title="Unknown!">' + html + '</abbr>';
		return html;
	}; // formatPctHTML()


	var formatTimeHTML = function(sec, brief) {
		if (sec !== sec)
			return formatNumHTML(NaN, 1);
		if (!isFinite(sec))
			return formatNumHTML(sec, 0);

		var s = (sec % 60);
		var m = (sec / 60) | 0;
		var h = (m / 60) | 0;
		m = (m % 60) | 0;

	//  return ((sec >= 10) ? ((h ? (h.toFixed(0) + ':') : '') + ((h && m < 10) ? '0' : '') + m.toFixed(0) + ':' + (((h || m) && s < 10) ? '0' : '') + s.toFixed(0)) : s.toFixed(1));

		if (brief) {
			if (h) return (((h < 10) ? formatNumHTML(h+(m/60), 1) : formatNumHTML(h, 0)) + '<small class="semantic" edsy-text="unit-hours-abbr">h</small>');
			if (m) return (((m < 10) ? formatNumHTML(m+(s/60), 1) : formatNumHTML(m, 0)) + '<small class="semantic" edsy-text="unit-minutes-abbr">m</small>');
			return (((h && !m) ? '0<small class="semantic">m</small>' : '') + formatNumHTML(s, (sec < 10) ? 1 : 0) + '<small class="semantic" edsy-text="unit-seconds-abbr">s</small>');
		}
		var html = '';
		if (h) html += (formatNumHTML(h, 0) + '<small class="semantic" edsy-text="unit-hours-abbr">h</small>');
		if (m) html += (formatNumHTML(m, 0) + '<small class="semantic" edsy-text="unit-minutes-abbr">m</small>');
		if (h && !m) html += '0<small class="semantic" edsy-text="unit-minutes-abbr">m</small>';
		html += (formatNumHTML(s, (sec < 10) ? 1 : 0) + '<small class="semantic" edsy-text="unit-seconds-abbr">s</small>');
		return html;
	}; // formatTimeHTML()


	var formatPriceHTML = function(num, brief) {
		if (num !== num || !isFinite(num))
			return formatNumHTML(num, 0);
		if (!brief)
			return (formatNumHTML(num, 0) + '<small edsy-text="unit-credits-abbr">Cr</small>');
		var n = num;
		var k = 0;
		while (brief && n > 1000 && k < 4) {
			n /= 1000;
			k++;
		}
		var d = (n < 10) ? 2 : ((n < 100) ? 1 : 0);
		// apparently the KMBT suffixes are pretty universal and don't need to be localized?
		var s = (['','K','M','B','T'][k] || '');
		return [
			'<abbr',
			' edsy-vals-title="', encodeHTML(JSON.stringify({'number':num})), '"',
			' edsy-title="interp-number-credits-abbr"',
			' title="', formatNumText(num, 0), ' Cr"',
			' edsy-vals="', encodeHTML(JSON.stringify({'number':n,'number#':d,'suffix':s})), '"',
			' edsy-text="interp-number-suffix"',
			'>',
			formatNumHTML(n, d), ' ', s,
			'</abbr>',
			'<small edsy-text="unit-credits-abbr">Cr</small>'
		].join('');
	}; // formatPriceHTML()


	var formatAttrLabelHTML = function(attr) {
		var attribute = (cache.attribute[attr] || EMPTY_OBJ);
		return [
			'<abbr class="attribute"',
			' edsy-title="attr-', attr, '-desc"',
			' title="' + (attribute.desc || '') + '"',
			' edsy-text="attr-', attr, '-abbr"',
			'>' + (attribute.abbr || attr) + '</abbr>:'
		].join('');
	}; // formatAttrLabelHTML()


	var formatAttrHTML = function(attr, value, dec) {
		var attribute = (cache.attribute[attr] || EMPTY_OBJ);
		if (dec === undefined)
			dec = attribute.scale;
		if (value !== value)
			return formatNumHTML(NaN, dec);
		if (attribute.unit === '%')
			return formatPctHTML(value / 100, dec);
		if (attribute.time)
			return formatTimeHTML(value);
		return (((dec !== undefined) ? formatNumHTML(value, dec) : value) + ((attribute.unit && isFinite(value)) ? ('<small edsy-text="' + (UNIT_ABBR_TRANSLATIONS[attribute.unit] || '') + '">' + attribute.unit + '</small>') : ''));
	}; // formatAttrHTML()


	var HASH_NUM_CHR = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-';
	var HASH_CHR_NUM = {};
	for (var i = 0;  i < HASH_NUM_CHR.length;  i++)
		HASH_CHR_NUM[HASH_NUM_CHR[i]] = i;
	var HASHT_NUM_CHR = ' !"#$%&'+"'"+'()*+,-./:;<=>?@[\\]^_`{|}~';
	var HASHT_CHR_NUM = {};
	for (var i = 0;  i < HASHT_NUM_CHR.length;  i++)
		HASHT_CHR_NUM[HASHT_NUM_CHR[i]] = i;


	var hashEncode = function(n, l) {
		var h = '';
		while (n) {
			h = HASH_NUM_CHR[n & 0x3F] + h;
			n = n >> 6;
		}
		while (h.length < l)
			h = HASH_NUM_CHR[0] + h;
		return h;
	}; // hashEncode()


	var hashDecode = function(h) {
		var n=0, i=0;
		while (i < h.length)
			n = (n << 6) | (HASH_CHR_NUM[h[i++]] || 0);
		return n;
	}; // hashDecode()


	var hashEncodeS = function(s) {
		var h='', i=0, c;
		for (var i = 0;  i < s.length;  i++) {
			c = s.charCodeAt(i);
			if (c >= 0x20 && c <= 0xFFF) {
				h += HASH_NUM_CHR[c >> 6] + HASH_NUM_CHR[c & 0x3F];
			}
		}
		return h;
	}; // hashEncodeS()


	var hashDecodeS = function(h) {
		var s='', i=1, c1, c2;
		for (var i = 1;  i < h.length;  i += 2) {
			c1 = HASH_CHR_NUM[h[i - 1]] || 0;
			c2 = HASH_CHR_NUM[h[i]] || 0;
			s += String.fromCharCode((c1 << 6) | c2);
		}
		return s;
	}; // hashDecodeS()


	var hashEncodeT = function(t) {
		var h='', i=0, c;
		for (var i = 0;  i < t.length;  i++) {
			if ((c = HASH_CHR_NUM[t[i]]) !== undefined && c < 62) {
				h += t[i];
			} else if ((c = HASHT_CHR_NUM[t[i]]) !== undefined) {
				h += HASH_NUM_CHR[62] + HASH_NUM_CHR[c];
			} else if ((c = t.charCodeAt(i) - 0x7F) >= 0 && c <= 0xFFF) {
				h += HASH_NUM_CHR[63] + HASH_NUM_CHR[c >> 6] + HASH_NUM_CHR[c & 0x3F];
			}
		}
		return h;
	}; // hashEncodeT()


	var hashDecodeT = function(h) {
		var t='', i=0, c1, c2;
		while (i < h.length) {
			c1 = HASH_CHR_NUM[h[i++]];
			if (c1 !== undefined && c1 < 62) {
				t += HASH_NUM_CHR[c1];
			} else if (c1 == 62) {
				c2 = HASH_CHR_NUM[h[i++]] || 0;
				t += HASHT_NUM_CHR[c2];
			} else if (c1 == 63) {
				c1 = HASH_CHR_NUM[h[i++]] || 0;
				c2 = HASH_CHR_NUM[h[i++]] || 0;
				t += String.fromCharCode(((c1 << 6) | c2) + 0x7F);
			}
		}
		return t;
	}; // hashDecodeT()


	var fixed20Encode = function(n) {
		return min(max((n * (1 << 17) + 0.5) | 0, 0), 0xFFFFF);
	}; // fixed20Encode()


	var fixed20Decode = function(n) {
		return (1.0 * n / (1 << 17));
	}; // fixed20Decode()


	var float20Encode = function(f) {
		// this is a custom 20-bit floating point format based on the design of IEEE 16- and 32-bit floats
		// yes, it's probably a little silly to invent a custom data type just for a fan site,
		// but 16 bits just isn't quite enough precision to encode engineer attribute modifiers
		// and 32 bits would unnecessarily inflate the length of URL hashes, so here we are --taleden
		var s = (f < 0) | 0;
		f = (f < 0) ? -f : f;
		var m = f | 0;
		var e = ((1 << 5) - 1);
		if (isNaN(f)) { // NaN
			m = 1;
		} else if (f > ((1 << 15) - 1)) { // +/- Infinity
			m = 0;
		} else {
			e -= 1;
			f -= m;
			while (m < (1 << 14) && e > 0) {
				m <<= 1;
				e -= 1;
				f *= 2;
				if (f >= 1) {
					m |= 1;
					f -= 1;
				}
			}
			if (e == 0) {
				m = (m >> 1) + (m & 1);
				e = (m >= (1 << 15));
			} else if (f * 2 >= 1) {
				m += 1;
				if (m >= (1 << 15)) {
					m >>= 1;
					e += 1;
				}
			}
		}
		s &= 1;
		e &= ((1 << 5) - 1);
		m &= ((1 << 14) - 1);
		return (s << 19) | (e << 14) | m;
	}; // float20Encode()


	var float20Decode = function(b) {
		var s = (b >> 19) & 1;
		var e = (b >> 14) & ((1 << 5) - 1);
		var m = b & ((1 << 14) - 1);
		return (e >= ((1 << 5) - 1)) ? (m ? NaN : (s ? -Infinity : Infinity)) : ((s ? -1 : 1) * pow(2.0, e - ((1 << 5) - 2) + (e == 0)) * ((e ? (1 << 14) : 0) | m));
	}; // float20Decode()


	var b64Encode = function(t) {
		return btoa(t).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
	}; // b64Encode()


	var b64Decode = function(t) {
		return atob((t + '===').slice(0, t.length + ((4 - (t.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
	}; // b64Decode()


	/*
	* GAME FORMULAS
	*/


	var getJumpFuelCost = function(dist, mass, curfuel, fsdfuel, fsdopt, fsdmul, fsdpower, jumpbst) {
		// https://forums.frontier.co.uk/threads/mass-effect-on-hyperspace-range.32734/#post-643461
		var maxdist = getJumpDistance(mass, curfuel, fsdfuel, fsdopt, fsdmul, fsdpower, jumpbst);
		return pow(dist / maxdist, fsdpower) * min(curfuel, fsdfuel);
	}; // getJumpFuelCost()


	var getJumpDistance = function(mass, curfuel, fsdfuel, fsdopt, fsdmul, fsdpower, jumpbst) {
		// https://forums.frontier.co.uk/threads/mass-effect-on-hyperspace-range.32734/#post-643461
		return pow(min(curfuel, fsdfuel) / fsdmul, 1 / fsdpower) * fsdopt / (mass + curfuel) + jumpbst;
	}; // getJumpDistance()


	var getJumpRange = function(mass, curfuel, fsdfuel, fsdopt, fsdmul, fsdpower, jumpbst) {
		var range = 0;
		while (curfuel >= 0.000001) {
			range += getJumpDistance(mass, curfuel, fsdfuel, fsdopt, fsdmul, fsdpower, jumpbst);
			curfuel -= fsdfuel;
		}
		return range;
	}; // getJumpRange()


	var getMassCurveMultiplier = function(mass, minMass, optMass, maxMass, minMul, optMul, maxMul) {
		// https://forums.frontier.co.uk/threads/the-one-formula-to-rule-them-all-the-mechanics-of-shield-and-thruster-mass-curves.300225/
		return (minMul + pow(min(1.0, (maxMass - mass) / (maxMass - minMass)), log((optMul - minMul) / (maxMul - minMul)) / (optMass == minMass ? 1 : log((maxMass - optMass) / (maxMass - minMass)))) * (maxMul - minMul));
	}; // getMassCurveMultiplier()


	var getEffectiveDamageResistance = function(baseres, extrares, exemptres, bestres) {
		// https://forums.frontier.co.uk/threads/kinetic-resistance-calculation.266235/post-4230114
		// https://forums.frontier.co.uk/threads/shield-booster-mod-calculator.286097/post-4998592
		/* old
		var threshold = 30;
		var rawres = 1 - ((1 - baseres / 100) * (1 - extrares / 100));
		var maxres = 1 - ((1 - baseres / 100) * (1 - threshold / 100));
		return 100 * (rawres - max(0, pow((rawres - maxres) / 2, curve || 1)));
		*/
		baseres = baseres || 0;
		extrares = extrares || 0;
		exemptres = exemptres || 0;
		bestres = bestres || 0;
		var lo = max(max(30, baseres), bestres || 0);
		var hi = 65; // half credit past 30% means 100% -> 30 + (100 - 30) / 2 = 65%
		var expected = (1 - ((1 - baseres / 100) * (1 - extrares / 100))) * 100;
		var penalized = lo + (expected - lo) / (100 - lo) * (hi - lo); // remap range [lo..100] to [lo..hi]
		var actual = ((penalized >= 30) ? penalized : expected);
		var effective = (1 - ((1 - exemptres / 100) * (1 - actual / 100))) * 100;
//TODO console.log("gEDR("+baseres+","+extrares+","+exemptres+","+bestres+") = "+effective);
		return effective;
	}; // getEffectiveDamageResistance()


	var getEffectiveShieldBoostMultiplier = function(shieldbst) {
		// https://forums.frontier.co.uk/threads/very-experimental-shield-change.314820/post-4895068
		var i = (1 + (shieldbst / 100));
	//  i = min(i, (1 - exp(-0.7 * i)) * 2.5); // proposed during 2.3 beta, but not implemented
		return i;
	}; // getEffectiveShieldBoostMultiplier()


	var getPipDamageResistance = function(sys) {
		// https://forums.frontier.co.uk/threads/2-3-the-commanders-changelog.341916/
		return 60 * pow(sys / MAX_POWER_DIST, 0.85);
	}; // getPipDamageResistance()


	var getEquilibriumHeatLevel = function(heatdismax, thmload) {
		// https://forums.frontier.co.uk/threads/research-detailed-heat-mechanics.286628/post-6399855
		return sqrt(thmload / heatdismax);
	}; // getEquilibriumHeatLevel()


	var getTimeUntilHeatLevel = function(heatcap, heatdismax, thmload, heatlevel0, heatlevel) {
		// https://forums.frontier.co.uk/threads/research-detailed-heat-mechanics.286628/post-6519883
		heatdismax /= heatcap;
		if (!thmload) {
			var C = -1 / (heatdismax * heatlevel0);
			return ((1 / (heatdismax * heatlevel)) + C);
		}
		thmload /= heatcap;
		var sqrtAdivB = sqrt(heatdismax / thmload);
		var sqrtAmulB = sqrt(heatdismax * thmload);
		var C = -atanh(heatlevel0 * sqrtAdivB) / sqrtAmulB
		return ((atanh(heatlevel * sqrtAdivB) / sqrtAmulB) + C);
	}; // getTimeUntilHeatLevel()


	var getHeatLevelAtTime = function(heatcap, heatdismax, thmload, heatlevel0, seconds) {
		// https://forums.frontier.co.uk/threads/research-detailed-heat-mechanics.286628/post-6519883
		heatdismax /= heatcap;
		if (!thmload) {
			var C = -1 / (heatdismax * heatlevel0);
			return ((1 / (seconds - C)) / heatdismax);
		}
		thmload /= heatcap;
		var sqrtAdivB = sqrt(heatdismax / thmload);
		var sqrtAmulB = sqrt(heatdismax * thmload);
		var C = -atanh(heatlevel0 * sqrtAdivB) / sqrtAmulB
		return (tanh((seconds - C) * sqrtAmulB) / sqrtAdivB);
	}; // getHeatLevelAtTime()


	var getEffectiveWeaponThermalLoad = function(thmload, distdraw, wepcap, weplvl) {
		// https://forums.frontier.co.uk/threads/research-detailed-heat-mechanics.286628/post-6408594
		return (thmload * (1 + 4 * min(max(1 - (wepcap * weplvl - distdraw) / wepcap, 0), 1)));
	}; // getEffectiveWeaponThermalLoad()


	/*
	* SHIP BUILDS
	*/


	var Slot = function(build, slotgroup, slotnum, modid) {
		if (!build || !(build instanceof Build))
			throw 'invalid parent build';
		this.build = build;
		this.slotgroup = null;
		this.slotnum = null;
		if (slotgroup) {
			var ship = eddb.ship[build.getShipID()];
			if (!ship || (slotgroup === 'ship' && slotnum !== 'hull' && slotnum !== 'hatch') || (slotgroup !== 'ship' && (!ship.slots[slotgroup] || slotnum < 0 || slotnum > ship.slots[slotgroup].length)))
				throw 'invalid ship slot group ' + slotgroup + ' or #' + slotnum;
			this.slotgroup = slotgroup;
			this.slotnum = slotnum;
		}
		this.hash = null;
		this.modid = 0;
		this.module = null;
		this.discounts = 0;
		this.cost = 0;
		this.powered = true;
		this.priority = 1;
		this.preeng = 0;
		this.bpid = 0;
		this.bpgrade = 0;
		this.bproll = 0;
		this.expid = 0;
		this.attrModifier = null;
		this.attrOverride = null;
		if (modid) {
			if (!this.setModuleID(modid))
				throw 'invalid initial module id #' + modid;
		}
	}; // Slot


	Slot.prototype = {

		getSlotGroup: function() {
			return this.slotgroup;
		}, // getSlotGroup()


		getSlotNum: function() {
			return this.slotnum;
		}, // getSlotNum()


		getSlotSize: function() {
			var ship = eddb.ship[this.build.getShipID()];
			return (ship ? ship.slots[this.slotgroup][this.slotnum] : MAX_SLOT_CLASS);
		}, // getSlotSize()


		clearHash: function() {
			this.hash = null;
			if (this.slotgroup) this.build.clearHash();
		}, // clearHash()


		clearStats: function() {
			this.clearHash();
			if (this.slotgroup) this.build.clearStats();
		}, // clearStats()


		isModuleIDValid: function(modid) {
			if (this.slotgroup === 'ship') return ((this.slotnum === 'hull' && modid == this.build.getShipID()) || (this.slotnum === 'hatch' && modid == SHIP_HATCH_ID)); // ship pseudogroup can only contain hull or cargo hatch
			if (!modid) return (this.slotgroup !== 'component'); // core components cannot be empty
			var module = eddb.module[modid];
			if (!module) return false; // module does not exist
			if (this.slotgroup && !((this.slotgroup === 'component') ? eddb.group.component[this.slotnum] : eddb.group[this.slotgroup]).mtypes[module.mtype]) return false; // group does not allow the module type
			return true;
		}, // isModuleIDValid()


		isModuleIDAllowed: function(modid) {
			if (!this.isModuleIDValid(modid)) return false; // module must be valid to be allowed
			if (!this.slotgroup || this.slotgroup === 'ship' || !modid) return true; // detached slots, ship pseudogroup slots, and empty slots are always allowed if they're valid
			var shipid = this.build.getShipID();
			var ship = eddb.ship[shipid];
			var slotsize = this.getSlotSize();
			var module = eddb.module[modid];
			if (module.class > slotsize) return false; // module is too large for the slot
			if (module.class < slotsize && this.slotgroup === 'component' && (this.slotnum == CORE_ABBR_SLOT.LS || this.slotnum == CORE_ABBR_SLOT.SS)) return false; // module is too small for the slot (i.e. life support, sensors)
			if (module.class < slotsize && module.noundersize) return false; // mtype can normally be undersized, but this module cannot (i.e. SCO FSD)
			if (module.reserved && !module.reserved[shipid]) return false; // module does not allow the ship (i.e. fighter hangars, luxury cabins, Mk II stuff
			var shipreserved = ((ship.reserved || EMPTY_OBJ)[this.slotgroup] || EMPTY_OBJ)[this.slotnum];
			if (shipreserved && !shipreserved[module.mtype]) return false; // slot does not allow the module type (i.e. Beluga/Orca/Dolphin cabins-only slots, Panther cargo-only slots, Prospector mining/limpet/hangar slots)
			// TODO: generalize these special cases for mk ii cargo racks, mining multi-limpet controllers, passenger cabins only in 'Cargo', 'LimpetController', 'Passenger' slots, respectively
			var slotname = (((ship.slotnames || EMPTY_OBJ)[this.slotgroup] || EMPTY_OBJ)[this.slotnum] || '').toUpperCase();
			if (module.mtype == 'icr' && module.reserved && !slotname.startsWith('CARGO')) return false;
			if (module.mtype == 'imlc' && module.reserved && !slotname.startsWith('LIMPETCONTROLLER')) return false;
			// apparently Mk II Passenger Cabins are *not* restricted to Passenger slots, only to the ship overall
			// if (module.mtype == 'ipc' && module.reserved && !slotname.startsWith('PASSENGER')) return false;
			// the Type11 hangar slot forbids regular vehicle hangars but allows both the mk ii large (which is reserved to fighter-capable ships) and the regular large (which isn't reserved). oy what a mess
			if (module.mtype == 'ipvh' && !module.fdname.toUpperCase().includes('LARGEBUGGYBAY') && slotname.startsWith('FIGHTERBAY')) return false;
			// the Mining Volley Repeater is allowed on the Anaconda Mk II's lower large hardpoints (slotnum 3,4) but not the others, because why not
			if (modid == 80339 && shipid == 18 && (this.slotnum < 3 || this.slotnum > 4)) return false;
			return true;
		}, // isModuleIDAllowed()


		isEnough: function() {
			if (!this.slotgroup || this.slotgroup === 'ship' || !this.modid) return true; // detached slots, ship pseudogroup slots, and empty slots are always enough if they're allowed
			var ship = eddb.ship[this.build.getShipID()];
			if (this.slotgroup === 'component' && this.slotnum == CORE_ABBR_SLOT.TH && ship.mass > this.getEffectiveAttrValue('engmaxmass')) return false; // ship mass exceeds thruster maximum
			if (this.slotgroup === 'component' && this.slotnum == CORE_ABBR_SLOT.PD && (ship.boostcost + BOOST_MARGIN) > this.getEffectiveAttrValue('engcap')) return false; // ship boost cost exceeds distributor capacity
			if (this.module.mtype === 'isg' && ship.mass > this.getEffectiveAttrValue('genmaxmass')) return false; // ship mass exceeds shieldgen maximum
			return true;
		}, // isEnough()


		swapWith: function(slot2) {
			if (!slot2 || !(slot2 instanceof Slot) || (slot2.build !== this.build) || !this.slotgroup || (this.slotgroup === 'ship') || !slot2.slotgroup || (slot2.slotgroup === 'ship'))
				return false;
			var modid1 = this.modid;
			var modid2 = slot2.modid;
			if (!(current.option.experimental ? (this.isModuleIDValid(modid2) && slot2.isModuleIDValid(modid1)) : (this.isModuleIDAllowed(modid2) && slot2.isModuleIDAllowed(modid1))))
				return false;
			var slotgroup1 = this.slotgroup;
			var slotnum1 = this.slotnum;
			this.slotgroup = slot2.slotgroup;
			this.slotnum = slot2.slotnum;
			slot2.slotgroup = slotgroup1;
			slot2.slotnum = slotnum1;
			return true;
		}, // swapWith()


		getShipID: function() {
			return this.build.getShipID();
		}, // getShipID()


		getModuleID: function() {
			return this.modid;
		}, // getModuleID()


		getModule: function() {
			return this.module;
		}, // getModule()


		getModuleMtype: function() {
			return (this.module || EMPTY_OBJ).mtype;
		}, // getModuleMtype()


		setModuleID: function(modid, experimental) {
			if (!(experimental ? this.isModuleIDValid(modid) : this.isModuleIDAllowed(modid)))
				return false;
			this.modid = (modid | 0);
			this.module = ((this.slotgroup === 'ship' && this.slotnum === 'hull') ? eddb.ship[modid] : this.build.getModule(modid));
			this.discounts = 0;
			this.cost = 0;
			this.preeng = 0;
			this.bpid = 0;
			this.bpgrade = 0;
			this.bproll = 0;
			this.expid = 0;
			this.attrModifier = null;
			this.attrOverride = null;
			this.clearStats();
			return true;
		}, // setModuleID()


		hasActualCost: function() {
			return (this.cost > 0);
		}, // hasActualCost()


		getDiscounts: function() {
			return this.discounts;
		}, // getDiscounts()


		setDiscounts: function(discounts) {
			this.discounts = (this.getBaseCost() ? (discounts & 0x3F) : 0);
			this.cost = 0;
			this.clearStats();
			return true;
		}, // setDiscounts()


		getBaseCost: function() {
			return this.getBaseAttrValue('cost');
		}, // getBaseCost()


		getCost: function() {
			return (this.hasActualCost() ? this.cost : this.getEffectiveAttrValue('cost'));
		}, // getCost()


		setCost: function(cost) {
			cost = parseInt(round(min(max(cost, 0), 9999999999)));
			var base = this.getBaseCost();
			this.discounts = (base ? getClosestDiscount(cost / base) : 0);
			this.cost = cost;
			this.clearStats();
			return true;
		}, // setCost()


		getPowered: function() {
			return !!this.getPowerLock() || this.powered;
		}, // getPowered()


		setPowered: function(powered) {
			powered = !!powered;
			if (powered != (!!this.getPowerLock() || powered))
				return false;
			this.powered = powered;
			this.clearStats();
			return true;
		}, // setPowered()


		getPowerLock: function() {
			return (this.module || EMPTY_OBJ).powerlock;
		}, // getPowerLock()


		getPriority: function() {
			return this.getPowerLock() || this.priority;
		}, // getPriority()


		setPriority: function(priority) {
			priority = min(max(priority | 0, 1), MAX_POWER_PRIORITY);
			if (priority != (this.getPowerLock() || priority))
				return false;
			this.priority = priority;
			this.clearStats();
			return true;
		}, // setPriority()


		changePriority: function(delta) {
			let priority = this.priority;
			if (delta >= 0) {
				priority = (priority + delta - 1) % MAX_POWER_PRIORITY + 1;
			} else {
				priority = ((priority + delta) - delta * MAX_POWER_PRIORITY - 1) % 5 + 1;
			}
			return this.setPriority(priority);
		}, // changePriority()


		setPreEngineered: function(preeng) {
			this.preeng = preeng ? 1 : 0;
			this.clearHash();
			return true;
		}, // setPreEngineered()


		getPreEngineered: function() {
			return this.preeng;
		}, // getPreEngineered()


		setBlueprint: function(bpid, bpgrade, bproll) {
			if (!this.modid || (this.slotgroup === 'ship'))
				return false;
			if (bpid === null) {
				bpid = this.bpid;
			}
			if (bpid) {
				var blueprint = eddb.blueprint[bpid];
				if (!blueprint)
					return false;
				if (this.module.noblueprints && (this.module.noblueprints['*'] || this.module.noblueprints[bpid]))
					return false;
				var mtype = eddb.mtype[this.module.mtype];
				if (!mtype.modifiable || !mtype.blueprints || mtype.blueprints.indexOf(bpid) < 0)
					return false;
				if (bpgrade === null) {
					bpgrade = (this.bpid ? ((this.bpgrade / eddb.blueprint[this.bpid].maxgrade * blueprint.maxgrade + 0.5) | 0) : blueprint.maxgrade);
				} else {
					bpgrade = min(max(bpgrade, 1), blueprint.maxgrade);
				}
				this.bpid = bpid;
				this.bpgrade = bpgrade;
				if (bproll) {
					this.bproll = bproll = min(max(bproll, MIN_BPROLL), 1);
					this.attrModifier = {};
					this.attrOverride = {};
					for (var a = 0;  a < mtype.modifiable.length;  a++) {
						var attr = mtype.modifiable[a];
						var attribute = cache.attribute[attr];
						if (attribute && blueprint[attr] && (attribute.modset || attribute.modadd || attribute.modmod || this.getBaseAttrValue(attr))) {
							this.attrModifier[attr] = getBlueprintGradeRollAttrModifier(bpid, bpgrade, bproll, attr);
						}
					}
					// when modifying clip size, round up to a multiple of burst size
					// (this requires applying the ammoclip modifier manually to avoid rounding to step first)
					if (this.attrModifier['ammoclip']) {
						var ammoclip = this.getBaseAttrValue('ammoclip') * (1 + this.attrModifier['ammoclip']);
						var bstsize = this.getEffectiveAttrValue('bstsize');
						this.attrModifier['ammoclip'] = getModuleAttrModifier(this.module, 'ammoclip', ceil(ammoclip / bstsize) * bstsize);
					}
					// when modifying damage falloff, cap at maximum range
					if (this.attrModifier['dmgfall']) {
						var maximumrng = this.getEffectiveAttrValue('maximumrng');
						var dmgfall = this.getEffectiveAttrValue('dmgfall');
						this.attrModifier['dmgfall'] = getModuleAttrModifier(this.module, 'dmgfall', min(maximumrng, dmgfall));
					}
					this.clearStats();
				} else {
					this.bproll = 0;
					if (this.attrModifier) {
						this.attrOverride = {};
						for (var attr in this.attrModifier)
							this.attrOverride[attr] = true;
					} else {
						this.attrOverride = null;
					}
					this.clearHash();
				}
			} else {
				this.bpid = 0;
				this.bpgrade = 0;
				this.bproll = 0;
				if (bproll) {
					this.attrModifier = null;
					this.attrOverride = null;
					this.clearStats();
				} else {
					if (this.attrModifier) {
						this.attrOverride = {};
						for (var attr in this.attrModifier)
							this.attrOverride[attr] = true;
					} else {
						this.attrOverride = null;
					}
					this.clearHash();
				}
			}
			return true;
		}, // setBlueprint()


		getBlueprintID: function() {
			return this.bpid;
		}, // getBlueprintID()


		setBlueprintID: function(bpid) {
			return this.setBlueprint(bpid, this.bpgrade, this.bproll);
		}, // setBlueprintID()


		getBlueprintGrade: function() {
			return this.bpgrade;
		}, // getBlueprintGrade()


		setBlueprintGrade: function(bpgrade) {
			return this.setBlueprint(this.bpid, bpgrade, this.bproll);
		}, // setBlueprintGrade()


		getBlueprintRoll: function() {
			return this.bproll;
		}, // getBlueprintRoll()


		setBlueprintRoll: function(bproll) {
			return this.setBlueprint(this.bpid, this.bpgrade, bproll);
		}, // setBlueprintRoll()


		getExpeffectID: function() {
			return this.expid;
		}, // getExpeffectID()


		setExpeffectID: function(expid) {
			if (!this.modid || (this.slotgroup === 'ship'))
				return false;
			if (expid) {
				if (!eddb.expeffect[expid])
					return false;
				if (this.module.noexpeffects && (this.module.noexpeffects['*'] || this.module.noexpeffects[expid]))
					return false;
				var mtype = eddb.mtype[this.module.mtype];
				if (!mtype.expeffects || mtype.expeffects.indexOf(expid) < 0)
					return false;
				this.expid = expid;
			} else {
				this.expid = 0;
			}
			this.clearStats();
			return true;
		}, // setExpeffectID()


		isModifiable: function() {
			return !!(this.modid && (this.slotgroup !== 'ship') && eddb.mtype[this.module.mtype].modifiable && (!this.module.noblueprints || !this.module.noblueprints['*']));
		}, // isModifiable()


		isModified: function() {
			return !!(this.attrModifier || this.expid);
		}, // isModified()


		getAttrValue: function(attr, modified) {
			switch (attr) {
			case 'fpc':
			case 'sfpc':
				var ammoclip = this.getAttrValue('ammoclip', modified);
				if (ammoclip) {
					// Auto Loader adds 1 round per 2 shots for an almost-but-not-quite +100% effective clip size
					if (modified && this.expid === 'wpnx_aulo')
						ammoclip += ammoclip - 1;
					return ammoclip;
				}
				return this.getAttrValue('bstsize', modified);

			case 'spc':
			case 'sspc':
				var dmgmul = this.getAttrValue('dmgmul', modified);
				var duration = this.getAttrValue('duration', modified) * (dmgmul ? WEAPON_CHARGE : 1.0);
				if (this.modid == 84224 && attr === 'sspc') // TODO: bug? Imperial Hammer Rail Gun can keep firing through reloads without re-charging
					duration = 0;
				var bstsize = this.getAttrValue('bstsize', modified);
				var bstrof = this.getAttrValue('bstrof', modified);
				var bstint = this.getAttrValue('bstint', modified);
				var spc = (duration + (bstsize - 1) / bstrof + bstint);
				var ammoclip = this.getAttrValue('ammoclip', modified);
				var rldtime = (attr === 'sspc') ? this.getAttrValue('rldtime', modified) : 0;
				if (ammoclip) {
					// Auto Loader adds 1 round per 2 shots for an almost-but-not-quite +100% effective clip size
					if (modified && this.expid === 'wpnx_aulo')
						ammoclip += ammoclip - 1;
					spc *= ceil(ammoclip / bstsize);
				}
				return spc + max(0, rldtime - duration - bstint);

			case 'rof':
				return (this.getAttrValue('fpc', modified) / this.getAttrValue('spc', modified));

			case 'srof':
				return (this.getAttrValue('sfpc', modified) / this.getAttrValue('sspc', modified));

			case 'dps':
			case 'sdps':
				var damage = this.getAttrValue('damage', modified);
				var dmgmul = (1 + WEAPON_CHARGE * ((this.getAttrValue('dmgmul', modified) || 1) - 1));
				var rounds = this.getAttrValue('rounds', modified);
				var rof = this.getAttrValue((attr === 'sdps') ? 'srof' : 'rof', modified);
				return (damage * dmgmul * rounds * (isFinite(rof) ? rof : 1));

			case 'eps':
			case 'seps':
				var distdraw = this.getAttrValue('distdraw', modified);
				var rof = this.getAttrValue((attr === 'seps') ? 'srof' : 'rof', modified);
				return (distdraw * (isFinite(rof) ? rof : 1));

			case 'hps':
			case 'shps':
				var thmload = this.getAttrValue('thmload', modified);
				var rof = this.getAttrValue((attr === 'shps') ? 'srof' : 'rof', modified);
				return (thmload * (isFinite(rof) ? rof : 1));

			case 'engminmul':
			case 'engoptmul':
			case 'engmaxmul':
				attr = attr.slice(3);
				var spd = this.getAttrValue(attr+'spd', modified);
				var acc = this.getAttrValue(attr+'acc', modified);
				var rot = this.getAttrValue(attr+'rot', modified);
				return (spd + acc + rot) / 3.0;
			}

			return getModuleAttrValue(this.module, attr, modified ? this.getEffectiveAttrModifier(attr) : undefined);
		}, // getAttrValue()


		getBaseAttrValue: function(attr) {
			return this.getAttrValue(attr, false);
		}, // getBaseAttrValue()


		getEffectiveAttrValue: function(attr) {
			return this.getAttrValue(attr, true);
		}, // getEffectiveAttrValue()


		isAttrOverridden: function(attr) {
			return !!((this.attrOverride || EMPTY_OBJ)[attr]);
		}, // isAttrOverridden()


		getAllBaseAttrModifiers: function() {
			if (!this.attrModifier)
				return null;
			var m = {};
			for (var attr in this.attrModifier)
				m[attr] = this.attrModifier[attr];
			return m;
		}, // getAllBaseAttrModifiers()


		getBaseAttrModifier: function(attr) {
			return ((this.attrModifier || EMPTY_OBJ)[attr] || 0);
		}, // getBaseAttrModifier()


		getRelatedAttrModifier: function(attr) {
			switch (attr) {
			case 'cost':
				if (!this.hasActualCost())
					return (cache.discountMod[this.discounts] - 1);
				var base = this.getBaseCost();
				var value = this.getCost();
				if (!isFinite(base) || !isFinite(value))
					return 0;
				var modifier = (value / base) - 1;
				return (abs(modifier) < MIN_MODIFIER) ? 0 : modifier; // TODO: check for within 10?

			case 'brcdmg':
				return this.getEffectiveAttrModifier('damage');

			case 'rof':
			case 'srof':
				// can't just combine modifiers, they're too interrelated
				// instead, compare the derived values with and without modifiers
				var base = this.getAttrValue(attr, false);
				var value = this.getAttrValue(attr, true);
				if (!isFinite(base) || !isFinite(value))
					return 0;
				var modifier = (value / base) - 1;
				return (abs(modifier) < MIN_MODIFIER) ? 0 : modifier;

			case 'dps':
			case 'sdps':
				return getAttrModifierSum(attr,
					getAttrModifierSum(attr,
						getAttrModifierSum(attr,
							this.getEffectiveAttrModifier('damage'),
							this.getEffectiveAttrModifier('dmgmul') * WEAPON_CHARGE
						),
						this.getEffectiveAttrModifier('rounds')
					),
					this.getEffectiveAttrModifier(attr === 'sdps' ? 'srof' : 'rof')
				);

			case 'eps':
			case 'seps':
				return getAttrModifierSum(attr,
					this.getEffectiveAttrModifier('distdraw'),
					this.getEffectiveAttrModifier(attr === 'seps' ? 'srof' : 'rof')
				);

			case 'hps':
			case 'shps':
				return getAttrModifierSum(attr,
					this.getEffectiveAttrModifier('thmload'),
					this.getEffectiveAttrModifier(attr === 'shps' ? 'srof' : 'rof')
				);

			case 'shotspd':
				return max(0, this.getEffectiveAttrModifier('maximumrng'));

			case 'engminmass':
			case 'engmaxmass':
				// TODO: verify all combinations
				// thrusters legacy negative optmass: negative minmass, negative maxmass
				// thrusters legacy positive optmass:
				// thrusters modern negative optmass: negative minmass, negative maxmass
				// thrusters modern positive optmass: positive minmass, positive maxmass
				return this.getEffectiveAttrModifier('engoptmass');

			case 'engminmul':
			case 'engmaxmul':
			case 'engminbst':
			case 'engoptbst':
			case 'engmaxbst':
			case 'minmulspd':
			case 'optmulspd':
			case 'maxmulspd':
			case 'minmulacc':
			case 'optmulacc':
			case 'maxmulacc':
			case 'minmulrot':
			case 'optmulrot':
			case 'maxmulrot':
				return this.getEffectiveAttrModifier('engoptmul');

			case 'maxrng':
				return this.getEffectiveAttrModifier('typemis');

			case 'genminmass':
				// TODO: verify all combinations
				// shieldgen legacy negative optmass:
				// shieldgen legacy positive optmass:
				// shieldgen modern negative optmass: negative minmass
				// shieldgen modern positive optmass:
				return this.getEffectiveAttrModifier('genoptmass');

			case 'genmaxmass':
				// TODO: verify all combinations
				// shieldgen legacy negative optmass:
				// shieldgen legacy positive optmass: positive maxmass
				// shieldgen modern negative optmass: unchanged maxmass
				// shieldgen modern positive optmass:
				return max(0, this.getEffectiveAttrModifier('genoptmass'));

			case 'genminmul':
			case 'genmaxmul':
				return this.getEffectiveAttrModifier('genoptmul');
			}

			return 0;
		}, // getRelatedAttrModifier()


		getExperimentalAttrModifier: function(attr) {
			var modExp = ((eddb.expeffect[this.expid] || EMPTY_OBJ)[attr] || 0);
			if (modExp) {
				var attribute = cache.attribute[attr];
				modExp /= ((attribute.modset || attribute.modadd) ? 1 : (attribute.modmod || 100));
			}
			return modExp;
		}, // getExperimentalAttrModifier()


		getEffectiveAttrModifier: function(attr) {
			// get base, related and experimental modifiers
			var modBase = this.getBaseAttrModifier(attr);
			var modRel = this.getRelatedAttrModifier(attr);
			var modExp = this.getExperimentalAttrModifier(attr);

			// apply these modifiers in reverse; usually it doesn't matter, but for modset we want base to override related which overrides experimental
			return getAttrModifierSum(attr, getAttrModifierSum(attr, modExp, modRel), modBase);
		}, // getEffectiveAttrModifier()


		setEffectiveAttrModifier: function(attr, modifier) {
			if (attr === 'cost') {
				return this.setDiscounts(getClosestDiscount(1 + (modifier || 0)));
			} else if (attr === 'rof' || attr === 'srof') {
				var dmgmul = this.getEffectiveAttrValue('dmgmul');
				var duration = this.getEffectiveAttrValue('duration') * (dmgmul ? WEAPON_CHARGE : 1.0);
				if (this.modid == 84224 && attr === 'srof') // TODO: bug? Imperial Hammer Rail Gun can keep firing through reloads without re-charging
					duration = 0;
				var bstsize = this.getEffectiveAttrValue('bstsize');
				var bstrof = this.getEffectiveAttrValue('bstrof');
				var bstint = this.getBaseAttrValue('bstint');
				var ammoclip = this.getEffectiveAttrValue('ammoclip');
				if (this.expid === 'wpnx_aulo') // Auto Loader adds 1 round per 2 shots for an almost-but-not-quite +100% effective clip size
					ammoclip += max(0, ammoclip - 1);
				var rldtime = (attr === 'srof') ? this.getEffectiveAttrValue('rldtime') : 0;
				var rof = this.getBaseAttrValue('rof');
				// rof * (1 + rofmod) = (ammoclip || bstsize) / ((duration + (bstsize - 1) / bstrof + bstint * (1 + bstintmod)) * ceil((ammoclip || bstsize) / bstsize) + max(0, rldtime - duration - bstint * (1 + bstintmod)))
				// (((ammoclip || bstsize) / (rof * (1 + rofmod)) - max(0, rldtime - duration - bstint * (1 + bstintmod))) / ceil((ammoclip || bstsize) / bstsize) - duration - (bstsize - 1) / bstrof) / bstint - 1 = bstintmod
				attr = 'bstint';
				modifier = (((ammoclip || bstsize) / (rof * (1 + (modifier || 0))) - max(0, rldtime - duration - bstint)) / ceil((ammoclip || bstsize) / bstsize) - duration - (bstsize - 1) / bstrof) / bstint - 1;
				// TODO: how to handle bstint also appearing inside the max() when setting srof?
			}

			// get related and experimental modifiers
			var modRel = this.getRelatedAttrModifier(attr);
			var modExp = this.getExperimentalAttrModifier(attr);

			// set the base modifier
			var basemodifier = getAttrModifierDifference(attr, modifier, getAttrModifierSum(attr, modExp, modRel));
			return this.setAttrModifier(attr, basemodifier);
		}, // setEffectiveAttrModifier()


		setAttrModifier: function(attr, modifier) {
			if (!this.module)
				return false;
			if (attr === 'cost')
				return this.setDiscounts(getClosestDiscount(1 + (modifier || 0)));
			if (this.slotgroup === 'ship')
				return false;
			if (attr === 'rof' || attr === 'srof') {
				var dmgmul = this.getBaseAttrValue('dmgmul');
				var duration = this.getBaseAttrValue('duration') * (dmgmul ? WEAPON_CHARGE : 1.0);
				if (this.modid == 84224 && attr === 'srof') // TODO: bug? Imperial Hammer Rail Gun can keep firing through reloads without re-charging
					duration = 0;
				var bstsize = this.getBaseAttrValue('bstsize');
				var bstrof = this.getBaseAttrValue('bstrof');
				var bstint = this.getBaseAttrValue('bstint');
				var ammoclip = this.getBaseAttrValue('ammoclip');
				var rldtime = (attr === 'srof') ? this.getBaseAttrValue('rldtime') : 0;
				var rof = this.getBaseAttrValue('rof');
				// rof * (1 + rofmod) = (ammoclip || bstsize) / ((duration + (bstsize - 1) / bstrof + bstint * (1 + bstintmod)) * ceil((ammoclip || bstsize) / bstsize) + max(0, rldtime - duration - bstint * (1 + bstintmod)))
				// (((ammoclip || bstsize) / (rof * (1 + rofmod)) - max(0, rldtime - duration - bstint * (1 + bstintmod))) / ceil((ammoclip || bstsize) / bstsize) - duration - (bstsize - 1) / bstrof) / bstint - 1 = bstintmod
				attr = 'bstint';
				modifier = (((ammoclip || bstsize) / (rof * (1 + (modifier || 0))) - max(0, rldtime - duration - bstint)) / ceil((ammoclip || bstsize) / bstsize) - duration - (bstsize - 1) / bstrof) / bstint - 1;
				// TODO: how to handle bstint also appearing inside the max() when setting srof?
			}
			// set the modifier (or clear if it's tiny, probably just a rounding error)
			if (!modifier || abs(modifier) < MIN_MODIFIER) {
				if (this.attrModifier) {
					delete this.attrModifier[attr];
					delete this.attrOverride[attr];
					var empty = true;
					for (var key in this.attrModifier) {
						empty = false;
						break;
					}
					if (empty) {
						this.attrModifier = null;
						this.attrOverride = null;
					}
					this.clearStats();
				}
			} else {
				if (getModuleAttrModificationIndex(this.module, attr) < 0)
					return false;
				if (!this.attrModifier)
					this.attrModifier = {};
				this.attrModifier[attr] = getModuleAttrModifier(this.module, attr, getModuleAttrValue(this.module, attr, modifier));
				if (!this.attrOverride)
					this.attrOverride = {};
				this.attrOverride[attr] = true;
				this.clearStats();
			}

			return true;
		}, // setAttrModifier()


		getHash: function(stored) {
			/*
			module hash format (HASH_VERSION=20):
				<3 chars / 18 bits>: module id (0..262143)
				<1 char / 6 bits>: slot flags
					0x20 <bit 1>: costed?
					0x10 <bit 2>: engineered?
					0x08 <bit 3>: powered?
					0x07 <bit 4-6>: priority or powerlock (0..7)
				costed ?
					<1 char / 6 bits>: cost bits
						0x30 <bit 1-2>: number of extra cost chars
						0x0F <bit 3-6>: cost & 0xF
					<3-6 chars / 18-36 bits>: cost >> 4
				!costed ?
					<1 char / 6 bits>: discount bits
				engineered ?
					<2 chars / 12 bits>: engineering flags
						0x800 <bit 1>: preengineered
						0x780 <bit 2-5>: blueprint index (0..15)
						0x070 <bit 6-8>: blueprint grade (0..7)
						0x00F <bit 9-12>: experimental index (0..15)
					<2 chars / 12 bits: roll * 4000
					<1 char / 6 bits>: number of modified attributes (0..31)
					<4 chars / 24 bits>: modified attribute
						0xF00000 <bit 1-4>: attribute index (0..15)
						0x0FFFFF <bit 5-24>: modifier
					<...>
			*/
			if (!this.module || (this.slotgroup === 'ship' && this.slotnum === 'hull'))
				return '';
			if (!this.hash) {
				var modidhash = hashEncode(this.modid & 0x1FFFF, 3);

				var costed = this.hasActualCost();
				var costhash = '';
				if (costed) {
					var cost = this.getCost();
					var costbits = (cost & 0xF);
					cost >>= 4;
					var costsize = min(max(ceil(ceil(log2(cost)) / 6), 2), 5);
					costbits |= (((costsize - 2) & 0x3) << 4);
					costhash = hashEncode(costbits, 1) + hashEncode(cost, costsize);
				} else {
					costhash = hashEncode(this.discounts, 1);
				}

				var mtype = (eddb.mtype[this.module.mtype] || EMPTY_OBJ);
				var preeng = (this.preeng ? 1 : 0);
				var bpidx = ((mtype.blueprints || EMPTY_ARR).indexOf(this.bpid) + 1);
				var expidx = ((mtype.expeffects || EMPTY_ARR).indexOf(this.expid) + 1);
				var bproll = (((this.bproll * 4000) + 0.5) | 0);
				var nummods = 0, b_nummods = 0;
				var modulehash = '', b_modulehash = '';
				if (mtype.modifiable && this.attrModifier) {
					for (var a = 0;  a < mtype.modifiable.length;  a++) {
						var attr = mtype.modifiable[a];
						if (cache.attribute[attr] && this.attrModifier[attr]) {
							if (this.preeng || this.attrOverride[attr]) {
								nummods++;
								modulehash += hashEncode(((a & 0xF) << 20) | (float20Encode(this.attrModifier[attr]) & 0xFFFFF), 4);
							}
							b_nummods++;
							b_modulehash += hashEncode(((a & 0xF) << 20) | (float20Encode(this.attrModifier[attr]) & 0xFFFFF), 4);
						}
					}
				}
				var engbits = (((preeng & 0x1) << 11) | ((bpidx & 0xF) << 7) | ((this.bpgrade & 0x7) << 4) | (expidx & 0xF));
				var enghash = ((engbits || nummods) ? (hashEncode(engbits, 2) + hashEncode(bproll, 2) + hashEncode(nummods & 0x1F, 1) + modulehash) : '');
				var b_enghash = ((engbits || b_nummods) ? (hashEncode(engbits, 2) + hashEncode(0, 2) + hashEncode(b_nummods & 0x1F, 1) + b_modulehash) : ''); // ignore bproll, include all modifiers

				var slotbits = ((costed ? 0x20 : 0) | (enghash ? 0x10 : 0) | (this.getPowered() ? 0 : 0x8) | ((this.getPriority() - 1) & 0x7));
				this.hash = (modidhash + hashEncode(slotbits, 1) + costhash + enghash);
				this.storedhash = (hashEncode(HASH_VERSION, 1) + modidhash + hashEncode(slotbits & 0x30, 1) + costhash + enghash); // ignore slotbits 0x0F (powered, priority)
				this.builtinhash = (hashEncode(HASH_VERSION, 1) + modidhash + hashEncode(slotbits & 0x10, 1) + hashEncode(0x3F, 1) + b_enghash); // further ignore slotbits 0x20 (costed), assume discounts 0x3F (free), and ignore bproll
			}
			return (stored ? (stored > 1 ? this.builtinhash : this.storedhash) : this.hash);
		}, // getHash()


		getStoredHash: function() {
			return this.getHash(1);
		}, // getStoredHash()


		getBuiltinHash: function() {
			return this.getHash(2);
		}, // getBuiltinHash()


		setHash: function(hash, version, errors, experimental) {
			var errortag;
			if (errors) errortag = (this.slotgroup ? ('Slot ' + this.slotgroup + ' ' + ((this.slotgroup === 'component') ? CORE_SLOT_ABBR[this.slotnum].toLowerCase() : (isNaN(this.slotnum) ? this.slotnum : (this.slotnum * 1 + 1))) + ': ') : '');
			if (this.slotgroup === 'ship' && this.slotnum === 'hull') {
				if (errors) errors.push(errortag + 'Cannot change ship hull');
				return false;
			}
			var idmap = Build.getHashVersionMap(version);
			var i = 0;

			// module id
			var modid = ((version < 12 && this.slotgroup === 'ship' && this.slotnum === 'hatch') ? SHIP_HATCH_ID : hashDecode(hash.slice(i, (i += ((version < 9 && this.slotgroup === 'component') ? 2 : 3)))));
			if (this.slotgroup === 'hardpoint') {
				modid = idmap.hardpoint[modid] || idmap.utility[modid] || modid;
			} else if (this.slotgroup === 'component') {
				modid = idmap.component[this.slotnum][modid] || modid;
			} else if (this.slotgroup) {
				modid = idmap[this.slotgroup][modid] || modid;
			}
			modid = max(0, (idmap.module[modid] || modid)) & 0x1FFFF;
			if (!this.setModuleID(modid, experimental)) {
				if (errors) errors.push(errortag + 'Invalid module id: ' + modid);
				return false;
			} else if (experimental === EXPERIMENTAL_IMPORT && !this.setModuleID(modid)) {
				if (errors) errors.push(errortag + getModuleLabel(this.getModule()) + ' requires Experimental Mode');
			}

			// slot bits: costed/discounted, engineered, powered, priority
			var slotbits = ((version >= 8) ? hashDecode(hash.slice(i, (i += 1))) : 0);
			var costed = ((version >= 15) ? (slotbits & 0x20) : 0);
			var discounted = ((version >= 15) ? !costed : ((version >= 14) ? (slotbits & 0x20) : 0));
			var engineered = (slotbits & 0x10);
			var powered = !(slotbits & 0x8);
			var priority = (slotbits & 0x7) + 1;
			// invalid powered/priority is possible for powerlocked modules before v16
			if (!this.setPowered(powered) && (version >= 16 || !this.getPowerLock())) {
				if (errors) errors.push(errortag + 'Invalid powered setting: ' + powered);
			}
			if (!this.setPriority(priority) && (version >= 16 || !this.getPowerLock())) {
				if (errors) errors.push(errortag + 'Invalid power priority setting: ' + priority);
			}

			// cost/discount bits
			if (costed) {
				var costbits = hashDecode(hash.slice(i, (i += 1)));
				var cost = hashDecode(hash.slice(i, (i += (((costbits >> 4) & 0x3) + 2))));
				cost = (cost << 4) + (costbits & 0xF);
				if (!this.setCost(cost)) {
					if (errors) errors.push(errortag + 'Invalid cost: ' + cost);
				}
			} else if (discounted) {
				var discounts = hashDecode(hash.slice(i, (i += 1)));
				if (!this.setDiscounts(discounts)) {
					if (errors) errors.push(errortag + 'Invalid discounts: ' + discounts);
				}
			}

			// engineering bits
			var mtypeid = (this.module || EMPTY_OBJ).mtype;
			var mtype = (eddb.mtype[mtypeid] || EMPTY_OBJ);
			if (engineered) {
				var engbits = ((version >= 9) ? hashDecode(hash.slice(i, (i += ((version >= 12 && version <= 14) ? 3 : 2)))) : 0);
				var preeng, bpidx, bpid, bpgrade, expidx, expid, bproll, nummods;
				if (version >= 15) {
					preeng = (version >= 18) ? ((engbits >> 11) & 0x1) : !!cache.modulehashBuiltin[hash];
					bpidx = ((engbits >> 7) & 0xF);
					bpid = (idmap.blueprint[mtypeid] || mtype.blueprints || EMPTY_ARR)[bpidx - 1];
					bpgrade = ((engbits >> 4) & 0x7);
					expidx = (engbits & 0xF);
					bproll = hashDecode(hash.slice(i, (i += 2))) / 4000.0;
					nummods = hashDecode(hash.slice(i, (i += 1)));
				} else if (version >= 12) {
					preeng = !!cache.modulehashBuiltin[hash];
					var bprolled = ((version >= 14) ? (engbits & 0x20000) : false);
					bpidx = ((engbits >> 13) & ((version >= 14) ? 0xF : 0x1F));
					bpid = (idmap.blueprint[mtypeid] || mtype.blueprints || EMPTY_ARR)[bpidx - 1];
					bpgrade = ((engbits >> 10) & 0x7);
					expidx = ((engbits >> 5) & 0x1F);
					bproll = (bprolled ? max(MIN_BPROLL, (engbits & 0x1F) * 0.05) : 0);
					nummods = (bprolled ? 0 : (engbits & 0x1F));
				} else {
					preeng = !!cache.modulehashBuiltin[hash];
					bpidx = ((engbits >> 6) & 0x3F);
					bpid = (bpidx ? (idmap.blueprint[mtypeid] || mtype.blueprints || EMPTY_ARR)[((bpidx % 10 + 0.5) | 0)] : 0);
					bpgrade = ((bpidx / 10 + 0.5) | 0);
					expidx = 0;
					bproll = 0;
					nummods = (engbits & 0x3F);
				}
				expid = (idmap.expeffect[mtypeid] || mtype.expeffects || EMPTY_ARR)[expidx - 1];

				// convert surface scanner blueprints
				if (version < 13 && mtypeid === 'iss' && bpid && bpgrade > 0) {
					preeng = 0;
					bpid = 'iss_er';
					bpgrade--;
					bproll = 1.0;
					nummods = 0;
				}

				// set blueprint, grade, roll
				if (!this.setPreEngineered(preeng)) {
					if (errors) errors.push(errortag + 'Cannot set pre-engineered: '+preeng);
				}
				if (!this.setBlueprint(bpid, bpgrade, bproll)) {
					if (errors) errors.push(errortag + 'Invalid blueprint: '+bpid+' G'+bpgrade+' @'+bproll);
				}
				if (!this.setExpeffectID(expid)) {
					if (errors) errors.push(errortag + 'Invalid experimental effect: '+expid);
				}

				// attr mods
				var v9rof = 0;
				while (nummods-- > 0) {
					var attrmod = hashDecode(hash.slice(i, (i += 4)));
					var attr = (mtype.modifiable || EMPTY_ARR)[((attrmod >> 20) & 0xF)];
					var attribute = cache.attribute[attr];
					if (attribute) {
						var modifier = float20Decode(attrmod & 0xFFFFF);
						if (version < 9) {
							// several attributes were changed from modmul or modadd to modmod;
							// conversion thus depends on the base attribute values, so we have
							// to duplicate them here for affected modules to guard against them
							// possibly changing in the future and breaking the conversion
							if (attr === 'hullbst') {
								var v0 = {C:80,B:152,A:250}[this.module.rating] || getModuleAttrValue(this.module, attr);
								var v1 = v0 * (1 + modifier);
								modifier = (1 + (v1 / attribute.modmod)) / (1 + (v0 / attribute.modmod)) - 1;
							} else if (attr === 'shieldbst') {
								var v0 = {E:4,D:8,C:12,B:16,A:20}[this.module.rating] || getModuleAttrValue(this.module, attr);
								var v1 = v0 * (1 + modifier);
								modifier = (1 + (v1 / attribute.modmod)) / (1 + (v0 / attribute.modmod)) - 1;
							} else if (attr === 'kinres' || attr === 'thmres' || attr === 'expres') {
								if (mtypeid === 'cbh') {
									var v0 = ({1:{k:-20,t:0,e:-40},2:{k:-20,t:0,e:-40},3:{k:-20,t:0,e:-40},4:{k:-75,t:50,e:-50},5:{k:25,t:-40,e:20}}[modid % 10] || EMPTY_OBJ)[attr[0]] || getModuleAttrValue(this.module, attr);
								} else if (mtypeid === 'ihrp') {
									var v0 = [0,0.5,1,1.5,2,2.5][this.module.class] || getModuleAttrValue(this.module, attr);
								} else if (mtypeid === 'isg') {
									var v0 = {k:40,t:-20,e:50}[attr[0]] || getModuleAttrValue(this.module, attr);
								} else {
									var v0 = 0;
								}
								var v1 = v0 + modifier;
								modifier = (1 + (v1 / attribute.modmod)) / (1 + (v0 / attribute.modmod)) - 1;
							} else if (attr === 'bstsize') {
								// bstsize was changed from modadd to modset, but was only available on Frag Cannons
								// which all had base bstsize:1, so we can just add 1 to the old modifier
								modifier += 1;
							} else if (attr === 'bstint') {
								// all rof modifiers were changed in-place to bstint, so if that's what we detect,
								// we have to hang onto it and apply it later as a rof modifier so that it will be
								// adjusted for the burst values, which may also be modified in the mean time
								v9rof = modifier;
								continue;
							}
						}
						if (!this.setAttrModifier(attr, modifier)) {
							if (errors) errors.push(errortag + 'Invalid modification: '+attr+' '+modifier);
						}
					}
				}
				if (v9rof) {
					if (!this.setAttrModifier('rof', v9rof)) {
						if (errors) errors.push(errortag + 'Invalid modification: rof '+v9rof);
					}
				}
			}

			this.clearStats();
			return true;
		}, // setHash()


		setStoredHash: function(modulehash, errors, experimental) {
			var version = hashDecode(modulehash.slice(0,1));
			var powered = this.getPowered();
			var priority = this.getPriority();
			var ok = this.setHash(modulehash.slice(1), version, errors, experimental);
			this.setPowered(powered);
			this.setPriority(priority);
			return ok;
		}, // setStoredHash()


		exportText: function() {
			var module = this.getModule();
			if (!module)
				return '';
			var buffer = [];
			var tag, line;

			// slot tag, module label, powered, priority
			switch (this.getSlotGroup()) {
			case 'hardpoint':  line = getTranslation('size-'+this.getSlotSize()+'-abbr');              break;
			case 'utility':    line = getTranslation('size-0-abbr');                                   break;
			case 'component':  line = getTranslation('ui-slot-component-'+this.getSlotNum()+'-abbr');  break;
			case 'military':   line = getTranslation('ui-slot-military-abbr');                         break;
			case 'internal':   line = formatNumText(this.getSlotSize(),0);                             break;
			default:           return '';
			}
			line += ': ' + getModuleLabel(module);
			if (this.getEffectiveAttrValue('pwrdraw'))
				line += ' [' + (this.getPowered() ? '+' : '-') + formatNumText(this.getPriority(),0) + ']';
			buffer.push(line);

			// module modification?
			if (this.isModified()) {
				var tag = ((this.getSlotGroup() === 'component' || this.getSlotGroup() === 'military') ? '**: ' : '*: ');
				var blueprint = eddb.blueprint[this.bpid];
				var expeffect = eddb.expeffect[this.expid];
				if (blueprint || expeffect) {
					buffer.push(
						tag
						+ (blueprint
							? (
								getTranslation('blueprint-'+this.bpid) + ' '
								+ getTranslation('interp-grade-abbr-number', {'number':this.bpgrade})
								+ (this.bproll ? (' ' + formatPctText(this.bproll, 1)) : '')
							)
							: getTranslation('option-no-blueprint')
						)
						+ (expeffect
							? (', ' + getTranslation('expeffect-'+this.expid))
							: ''
						)
					);
				}
				// gather relevant attrs: either directly or indirectly modifiable (via expeffect)
				var attrflag = {};
				var modifiable = ((eddb.mtype[this.module.mtype] || EMPTY_OBJ).modifiable || EMPTY_ARR);
				for (var a = 0;  a < modifiable.length;  a++)
					attrflag[modifiable[a]] = true;
				for (var attr in (expeffect || EMPTY_OBJ))
					attrflag[attr] = true;
				// identify modified attrs
				var attrs = [];
				for (var attr in attrflag) {
					if (cache.attribute[attr] && this.getEffectiveAttrModifier(attr)) {
						if (attr === 'damage') {
							attrs.push('dps');
							if (isFinite(this.getBaseAttrValue('rof')))
								attrs.push('damage');
						} else if (attr === 'bstint') {
							attrs.push('dps');
							attrs.push('rof');
						} else {
							attrs.push(attr);
						}
					}
				}
				// sort and export modified attrs
				if (attrs.length > 0) {
					attrs.sort(sortAttributes);
					line = '';
					for (var a = 0;  a < attrs.length;  a++) {
						var attr = attrs[a];
						var text = '; ' + getTranslation('attr-'+attr) + ' ' + getModuleAttrModifierText(module, attr, this.getEffectiveAttrModifier(attr));
						if (line && (line.length + text.length > 65)) {
							buffer.push(tag + line.slice(2));
							line = '';
						}
						line += text;
					}
					if (line)
						buffer.push(tag + line.slice(2));
				}
			}

			return buffer.join('\n');
		}, // exportText()


		exportJournal: function() {
			var ship = eddb.ship[this.build.getShipID()];
			var module = this.getModule();
			if (!ship || !module)
				return null;

			var slotsize = this.getSlotSize();
			var slotname = null;
			if (ship.slotnames && ship.slotnames[this.slotgroup]) {
				slotname = ship.slotnames[this.slotgroup][this.slotnum];
			} else {
				switch (this.slotgroup) {
				case 'hardpoint':
					var n = 0;
					for (var s = this.slotnum * 1;  s >= 0;  s--)
						n += (ship.slots.hardpoint[s] == slotsize);
					slotname = (['Tiny','Small','Medium','Large','Huge'][slotsize] || 'Unknown') + 'Hardpoint' + n;
					break;
				case 'utility':
					slotname = 'TinyHardpoint' + (this.slotnum * 1 + 1);
					break;
				case 'component':
					slotname = CORE_SLOT_FDNAME[this.slotnum * 1];
					break;
				case 'military':
					slotname = 'Military' + ((this.slotnum < 9) ? '0' : '') + (this.slotnum * 1 + 1);
					break;
				case 'internal':
					slotname = 'Slot' + ((this.slotnum < 9) ? '0' : '') + (this.slotnum * 1 + 1) + '_Size' + slotsize;
					break;
				default:
					return null;
				}
			}

			// slot and module
			var obj = {
				"Slot": slotname,
				"Item": (module.fdname || '').toLowerCase(),
				"On": !!this.getPowered(),
				"Priority": parseInt(this.getPriority() - 1),
				"Value": parseInt(this.getCost()),
			};

			// engineering?
			if (this.isModified()) {
				var obj_eng = obj["Engineering"] = {};
				var blueprint = eddb.blueprint[this.bpid];
				if (blueprint) {
					obj_eng["BlueprintName"] = blueprint.fdname;
					obj_eng["Level"] = this.bpgrade;
					obj_eng["Quality"] = (this.bproll ? parseFloat(this.bproll.toFixed(6)) : 0);
				}
				var expeffect = eddb.expeffect[this.expid];
				if (expeffect) {
					obj_eng["ExperimentalEffect"] = expeffect.fdname;
				}
				// gather relevant attrs: either directly or indirectly modifiable (via expeffect)
				var attrflag = {};
				var modifiable = ((eddb.mtype[this.module.mtype] || EMPTY_OBJ).modifiable || EMPTY_ARR);
				for (var a = 0;  a < modifiable.length;  a++)
					attrflag[modifiable[a]] = true;
				for (var attr in (expeffect || EMPTY_OBJ))
					attrflag[attr] = true;
				if (attrflag['damage']) {
					attrflag['dps'] = true;
					if (!isFinite(this.getBaseAttrValue('rof')))
						delete attrflag['damage'];
				}
				if (attrflag['bstint']) {
					attrflag['dps'] = true;
					attrflag['rof'] = true;
				}
				// identify modified attrs
				var attrs = [];
				for (var attr in attrflag) {
					if ((cache.attribute[attr] || EMPTY_OBJ).fdattr && this.getEffectiveAttrModifier(attr))
						attrs.push(attr);
				}
				// sort and export modified attrs
				if (attrs.length > 0) {
					attrs.sort(sortAttributes);
					var obj_eng_mod = obj_eng["Modifiers"] = [];
					for (var a = 0;  a < attrs.length;  a++) {
						obj_eng_mod.push({
							"Label": cache.attribute[attrs[a]].fdattr,
							"Value": parseFloat(this.getEffectiveAttrValue(attrs[a]).toFixed(6)),
							"OriginalValue": parseFloat(this.getBaseAttrValue(attrs[a]).toFixed(6)),
						});
					}
				}
			}

			return obj;
		}, // exportJournal()


	}; // Slot.prototype


	Slot.getModuleIDStoredHash = function(modid) {
		// HASH_VERSION=20
		return (hashEncode(HASH_VERSION, 1) + hashEncode(modid & 0x1FFFF, 3) + hashEncode(0, 2)); // slotbits(!costed), discountbits
	}; // getModuleIDStoredHash()


	Slot.getStoredHashModuleID = function(modulehash) {
		var version = hashDecode(modulehash.slice(0,1));
		if (version < 9)
			return null;
		var idmap = Build.getHashVersionMap(version);
		var modid = hashDecode(modulehash.slice(1, 4));
		return (idmap.module[modid] || modid);
	}; // getStoredHashModuleID()


	Slot.isStoredHashModified = function(modulehash) {
		var version = hashDecode(modulehash.slice(0,1));
		if (version < 9)
			return false;
		var slotbits = hashDecode(modulehash.slice(4, 5));
		return (slotbits & 0x10);
	}; // isStoredHashModified()


	var Build = function(shipid, stock) {
		var ship = eddb.ship[shipid];
		if (!ship)
			throw 'invalid ship id #' + shipid;
		this.hash = null;
		this.stats = null;
		this.shipid = shipid;
		this.name = '';
		this.nametag = '';
		this.inaraAcct = null;
		this.inaraShip = null;
		this.crewdist = { sys:0, eng:0, wep:0 };
		this.powerdist = { sys:4, eng:4, wep:4 };
		this.slots = {
			ship : {
				hull  : new Slot(this, 'ship', 'hull', shipid),
				hatch : new Slot(this, 'ship', 'hatch', SHIP_HATCH_ID),
			},
		};
		this.slots.ship.hull.setDiscounts(current.option.discounts);
		for (var slotgroup in ship.slots) {
			this.slots[slotgroup] = [];
			for (var slotnum = 0;  slotnum < ship.slots[slotgroup].length;  slotnum++) {
				var modid = ((slotgroup === 'component' || stock) ? ship.stock[slotgroup][slotnum] : 0);
				var discounts = current.option.discounts;
				if (modid < 0) {
					modid = -modid;
					discounts = 0x3F;
				}
				var slot = new Slot(this, slotgroup, slotnum, modid);
				this.slots[slotgroup].push(slot);
				slot.setDiscounts(discounts);
			}
		}
	}; // Build


	Build.prototype = {

		clearHash: function() {
			this.hash = null;
		}, // clearHash()


		clearStats: function() {
			this.clearHash();
			if (this.stats) {
				this.prevstats = this.stats;
				this.stats = null;
			}
		}, // clearStats()


		clearPrevStats: function() {
			this.prevstats = null;
		}, // clearPrevStats()


		getShipID: function() {
			return this.shipid;
		}, // getShipID()


		getModule: function(modid) {
			return ((cache.shipModules[this.shipid] || EMPTY_OBJ)[modid] || eddb.module[modid]);
		}, // getModule()


		getName: function() {
			return this.name || '';
		}, // getName()


		setName: function(name) {
			this.name = (name || '').slice(0,22);
			this.clearHash();
			return true;
		}, // setName()


		getNameTag: function() {
			return this.nametag || '';
		}, // getNameTag()


		setNameTag: function(nametag) {
			this.nametag = (nametag || '').slice(0,6);
			this.clearHash();
			return true;
		}, // setNameTag()


		getInaraBuildURL: function() {
			if (!this.inaraAcct || !this.inaraShip)
				return null;
			return ('https://inara.cz/cmdr-fleet/'+this.inaraAcct+'/'+this.inaraShip+'/');
		}, // getInaraBuildURL()


		setInaraXref: function(acct, ship) {
			acct = acct ? parseInt(acct) : null;
			ship = ship ? parseInt(ship) : null;
			if ((acct || ship) && (isNaN(acct) || acct < 1 || isNaN(ship) || ship < 1))
				return false;
			this.inaraAcct = acct;
			this.inaraShip = ship;
			return true;
		}, // setInaraXref()


		getInaraSearchURL: function() {
			var sid = this.getShipID();

			// pre-flag stock modules that will come with the ship anyway
			var ship = eddb.ship[sid];
			var fdidFlag = {};
			for (var slotgroup in this.slots) {
				if (slotgroup !== 'ship') {
					for (var slotnum = 0;  slotnum < ship.slots[slotgroup].length;  slotnum++) {
						var mid = abs(ship.stock[slotgroup][slotnum]);
						var module = cache.shipModules[sid][mid] || eddb.module[mid];
						if (module && module.fdid) {
							fdidFlag[module.fdid] = true;
						}
					}
				}
			}

			// identify all other modules in this build
			var fdidList = [];
			for (var slotgroup in this.slots) {
				if (slotgroup !== 'ship') {
					var slot;
					for (var slotnum = 0;  slot = this.getSlot(slotgroup, slotnum);  slotnum++) {
						var mid = slot.getModuleID();
						var module = cache.shipModules[sid][mid] || eddb.module[mid];
						if (module && module.fdid && !fdidFlag[module.fdid] && module.tag !== 'C' && module.tag !== 'P' && module.tag !== 'T') {
							fdidFlag[module.fdid] = true;
							fdidList.push(module.fdid);
						}
					}
				}
			}
			return ('https://inara.cz/inapi/outfitsearch.php?m=' + fdidList.join(',') + (eddb.ship[sid].fdid ? ('&s=' + eddb.ship[sid].fdid) : ''));
		}, // getInaraSearchURL()


		getEDDBioURL: function() {
			var sid = this.getShipID();

			// pre-flag stock modules that will come with the ship anyway
			var ship = eddb.ship[sid];
			var idFlag = {};
			for (var slotgroup in this.slots) {
				if (slotgroup !== 'ship') {
					for (var slotnum = 0;  slotnum < ship.slots[slotgroup].length;  slotnum++) {
						var mid = abs(ship.stock[slotgroup][slotnum]);
						var module = cache.shipModules[sid][mid] || eddb.module[mid];
						var eddbid = module ? module.eddbid : 0;
						if (eddbid) {
							idFlag[eddbid] = true;
						}
					}
				}
			}

			// identify all other modules in this build
			var idList = [];
			for (var slotgroup in this.slots) {
				if (slotgroup !== 'ship') {
					var slot;
					for (var slotnum = 0;  slot = this.getSlot(slotgroup, slotnum);  slotnum++) {
						var mid = slot.getModuleID();
						var module = cache.shipModules[sid][mid] || eddb.module[mid];
						if (module && module.eddbid && !idFlag[module.eddbid] && module.tag !== 'C' && module.tag !== 'P' && module.tag !== 'T') {
							idFlag[module.eddbid] = true;
							idList.push(module.eddbid);
						}
					}
				}
			}
			return ('https://eddb.io/station?m=' + idList.join(',') + (eddb.ship[sid].eddbid ? ('&s=' + eddb.ship[sid].eddbid) : ''));
		}, // getEDDBioURL()


		getCrewDist: function(dist) {
			if (dist)
				return this.crewdist[dist];
			return {
				sys:this.crewdist.sys,
				eng:this.crewdist.eng,
				wep:this.crewdist.wep,
			};
		}, // getCrewDist()


		setCrewDist: function(sys, eng, wep) {
			var maxcrew = (this.getSlot('ship', 'hull').getEffectiveAttrValue('crew') - 1);
			this.crewdist.sys = sys = min(max(sys | 0, 0), maxcrew);
			this.crewdist.eng = eng = min(max(eng | 0, 0), maxcrew - sys);
			this.crewdist.wep = wep = min(max(wep | 0, 0), maxcrew - sys - eng);
			this.clearStats();
			return true;
		}, // setCrewDist()


		changeCrewDist: function(dist, delta) {
			var maxcrew = (this.getSlot('ship', 'hull').getEffectiveAttrValue('crew') - 1);
			var curcrew = (this.crewdist.sys + this.crewdist.eng + this.crewdist.wep);
			var distlist = ['sys','eng','wep'];
			var num = 0;
			var mod = 0;
			if (dist === 'avl') {
				if (delta < 0) {
					num = min(delta, maxcrew - curcrew);
					mod = 1;
				} else if (delta > 0) {
					num = min(delta, curcrew);
					mod = -1;
				}
			} else if (!(dist in this.crewdist)) {
				return false;
			} else if (delta < 0) {
				this.crewdist[dist] -= min(-delta, this.crewdist[dist]);
			} else if (delta > 0) {
				num = min(delta, maxcrew - this.crewdist[dist]);
				this.crewdist[dist] += num;
				num = max(0, num - (maxcrew - curcrew));
				mod = -1;
			}
			for (var d = 0;  num > 0;  d = ((d+1) % distlist.length)) {
				if (distlist[d] !== dist && ((mod < 0 && this.crewdist[distlist[d]] > 0) || (mod > 0 && this.crewdist[distlist[d]] < maxcrew))) {
					num--;
					this.crewdist[distlist[d]] += mod;
				}
			}
			num = MAX_POWER_DIST - (this.powerdist[dist] + (this.crewdist[dist] << 1));
			if (num < 0)
				this.changePowerDist(dist, num);
			return this.setCrewDist(this.crewdist.sys, this.crewdist.eng, this.crewdist.wep);
		}, // changeCrewDist()


		getPowerDist: function(dist) {
			if (dist)
				return this.powerdist[dist];
			return { sys:this.powerdist.sys, eng:this.powerdist.eng, wep:this.powerdist.wep };
		}, // getPowerDist()


		getEffectivePowerDist: function(dist) {
			if (dist)
				return min(MAX_POWER_DIST, this.powerdist[dist] + (this.crewdist[dist] << 1));
			return {
				sys:min(MAX_POWER_DIST, this.powerdist.sys + (this.crewdist.sys << 1)),
				eng:min(MAX_POWER_DIST, this.powerdist.eng + (this.crewdist.eng << 1)),
				wep:min(MAX_POWER_DIST, this.powerdist.wep + (this.crewdist.wep << 1)),
			};
		}, // getEffectivePowerDist()


		setPowerDist: function(sys, eng, wep) {
			this.powerdist.sys = sys = min(max(sys | 0, 0                                           ), MAX_POWER_DIST);
			this.powerdist.eng = eng = min(max(eng | 0, 0, (TOTAL_POWER_DIST - MAX_POWER_DIST) - sys), MAX_POWER_DIST, TOTAL_POWER_DIST - sys);
			this.powerdist.wep = TOTAL_POWER_DIST - sys - eng;
			this.clearStats();
			return true;
		}, // setPowerDist()


		changePowerDist: function(sys0, delta) {
			if (!(sys0 in this.powerdist))
				return false;
			var sys1 = ((sys0 === 'sys') ? 'eng' : ((sys0 === 'eng') ? 'wep' : 'sys'));
			var sys2 = ((sys0 === 'sys') ? 'wep' : ((sys0 === 'eng') ? 'sys' : 'eng'));
			var dist0 = min(max(this.powerdist[sys0] + delta                 , 0), MAX_POWER_DIST, TOTAL_POWER_DIST);
			delta = dist0 - this.powerdist[sys0];
			var dist1 = min(max(this.powerdist[sys1] - (delta - (delta >> 1)), 0), MAX_POWER_DIST, TOTAL_POWER_DIST - dist0);
			var dist2 = TOTAL_POWER_DIST - dist0 - dist1;
			this.powerdist[sys0] = dist0;
			this.powerdist[sys1] = dist1;
			this.powerdist[sys2] = dist2;
			this.clearStats();
			return true;
		}, // changePowerDist()


		swapSlots: function(slotgroup1, slotnum1, slotgroup2, slotnum2) {
			if (!this.slots[slotgroup1] || !this.slots[slotgroup2] || slotgroup1 === 'ship' || slotgroup2 === 'ship')
				return false;
			var slot1 = this.slots[slotgroup1][slotnum1];
			var slot2 = this.slots[slotgroup2][slotnum2];
			if (!slot1 || !slot2 || !slot1.swapWith(slot2))
				return false;
			this.slots[slotgroup1][slotnum1] = slot2;
			this.slots[slotgroup2][slotnum2] = slot1;
			if ((slotgroup1 === 'component' && slotnum1 === CORE_ABBR_SLOT.FT) || (slotgroup2 === 'component' && slotnum2 === CORE_ABBR_SLOT.FT)) {
				this.clearStats();
			} else {
				this.clearHash();
			}
			return true;
		}, // swapSlots()


		copySlot: function(slotgroup1, slotnum1, slotgroup2, slotnum2) {
			if (!this.slots[slotgroup1] || !this.slots[slotgroup2] || slotgroup1 === 'ship' || slotgroup2 === 'ship')
				return false;
			var slot1 = this.slots[slotgroup1][slotnum1];
			var slot2 = this.slots[slotgroup2][slotnum2];
			if (!slot1 || !slot2)
				return false;
			slot2 = new Slot(this, slotgroup2, slotnum2, slot2.getModuleID());
			if (!slot2.setHash(slot1.getHash(), HASH_VERSION, null, current.option.experimental))
				return false;
			this.slots[slotgroup2][slotnum2] = slot2;
			this.clearStats();
			return true;
		}, // copySlot()


		getDetachedSlot: function() {
			return new Slot(this);
		}, // getDetachedSlot()


		getSlot: function(slotgroup, slotnum) {
			return (this.slots[slotgroup] || EMPTY_OBJ)[slotnum];
		}, // getSlot()


		getLimitedSlots: function() {
			var limitSlots = {};
			for (var slotgroup in this.slots) {
				if (slotgroup !== 'ship') {
					var slot;
					for (var slotnum = 0;  slot = this.getSlot(slotgroup, slotnum);  slotnum++) {
						var limit = (slot.getModule() || EMPTY_OBJ).limit;
						if (limit) {
							if (!limitSlots[limit])
								limitSlots[limit] = [];
							limitSlots[limit].push(slot);
						}
					}
				}
			}
			return limitSlots;
		}, // getLimitedSlots()


		updateStats: function() {
			var stats = this.stats = {
				cost: 0,
				cost_vehicle: 0,
				cost_restock: 0,
				cost_rearm: 0,
				mass: 0,
				pwrcap: 0,
				pwrbst: 0,
				pwrdraw_dep: [0,0,0,0,0,0],
				pwrdraw_ret: [0,0,0,0,0,0],
				thmload_ct: 0,
				thmload_cfsd: 0,
				thmload_hardpoint_wepfull: 0,
				thmload_hardpoint_wepempty: 0,
				thmload_iscb: 0,
				spinup_iscb: 0,
				jumpbst: 0,
				fuelcap: 0,
				cargocap: 0,
				cabincap: 0,
				scooprate: 0,
				hullbst: 0,
				hullrnf: 0,
				shieldbst: 0,
				shieldrnf: 0,
				shieldrnfps: 0,
				shieldrnfps_ammomax: 0,
				integ_imrp: 0,
				dmgprot: 1,
				dps: 0,
				dps_abs: 0,
				dps_thm: 0,
				dps_kin: 0,
				dps_exp: 0,
				dps_axe: 0,
				dps_cau: 0,
				dps_nodistdraw: 0,
				dps_distdraw: 0,
				ammotime_wepcap: 1/0,
				ammotime_nocap: 1/0,
				wepcap_burst_cur: 0,
				wepcap_burst_max: 0,
				wepchg_sustain_cur: 0,
				wepchg_sustain_max: 0,
				lmprepcap_max: 0,
				unlimit: {},
			};
			var kinmod_ihrp = 1;
			var thmmod_ihrp = 1;
			var expmod_ihrp = 1;
			var caumod_ihrp = 1;
			var kinmin_ihrp = 1;
			var thmmin_ihrp = 1;
			var expmin_ihrp = 1;
			var caumin_ihrp = 1;
			var kinmod_usb = 1;
			var thmmod_usb = 1;
			var expmod_usb = 1;
			var caumod_usb = 1;

			// ship hull
			var slot_hull = this.getSlot('ship', 'hull');
			stats.cost += slot_hull.getCost();
			stats.mass += slot_hull.getEffectiveAttrValue('mass');

			// cargo hatch
			var slot = this.getSlot('ship', 'hatch');
			stats.cost += slot.getCost();
			var module = slot.getModule();
			if (module && slot.getPowered()) {
				var pwrdraw = slot.getEffectiveAttrValue('pwrdraw');
				var priority = slot.getPriority();
				stats.pwrdraw_dep[0] += pwrdraw;
				stats.pwrdraw_dep[priority] += pwrdraw;
				stats.pwrdraw_ret[0] += pwrdraw;
				stats.pwrdraw_ret[priority] += pwrdraw;
			}

			// all other modules
			var wepcap = this.getSlot('component', CORE_ABBR_SLOT.PD).getEffectiveAttrValue('wepcap');
			var weapons = [];
			var slot_isg = null;
			for (var sg = 0;  sg < GROUPS.length;  sg++) {
				var slotgroup = GROUPS[sg];
				for (var slotnum = 0;  slot = this.getSlot(slotgroup, slotnum);  slotnum++) {
					if (module = slot.getModule()) {
						var mtypeid = module.mtype;
						stats.cost += slot.getCost();
						stats.cost_vehicle += slot.getEffectiveAttrValue('vslots') * slot.getEffectiveAttrValue('vcount') * (slot.getEffectiveAttrValue('ammocost') || 0);
						stats.mass += slot.getEffectiveAttrValue('mass');
						stats.pwrcap += slot.getEffectiveAttrValue('pwrcap');
						stats.pwrbst += slot.getEffectiveAttrValue('pwrbst');
						stats.fuelcap += slot.getEffectiveAttrValue('fuelcap');
						stats.cargocap += slot.getEffectiveAttrValue('cargocap');
						stats.cabincap += slot.getEffectiveAttrValue('cabincap');
						stats.hullbst += slot.getEffectiveAttrValue('hullbst');
						stats.hullrnf += slot.getEffectiveAttrValue('hullrnf');

						if (slotgroup === 'hardpoint') {
							stats.cost_rearm += (slot.getEffectiveAttrValue('ammoclip') + slot.getEffectiveAttrValue('ammomax')) * (slot.getEffectiveAttrValue('ammocost') || 0);
						} else if (slotgroup === 'utility') {
							stats.cost_restock += (slot.getEffectiveAttrValue('ammoclip') + slot.getEffectiveAttrValue('ammomax')) * (slot.getEffectiveAttrValue('ammocost') || 0);
						} else if (mtypeid === 'iafmu') {
							stats.cost_restock += slot.getEffectiveAttrValue('afmrepcap') * (slot.getEffectiveAttrValue('ammocost') || 0);
						} else if (mtypeid === 'imrp') {
							stats.integ_imrp += slot.getEffectiveAttrValue('integ');
							stats.dmgprot *= (1 - (slot.getEffectiveAttrValue('dmgprot') / 100));
						} else if (mtypeid === 'ihrp' || mtypeid === 'imahrp') {
							var kinmod = (1 - (slot.getEffectiveAttrValue('kinres') / 100));
							var thmmod = (1 - (slot.getEffectiveAttrValue('thmres') / 100));
							var expmod = (1 - (slot.getEffectiveAttrValue('expres') / 100));
							var caumod = (1 - (slot.getEffectiveAttrValue('caures') / 100));
							kinmod_ihrp *= kinmod;
							thmmod_ihrp *= thmmod;
							expmod_ihrp *= expmod;
							caumod_ihrp *= caumod;
							kinmin_ihrp = min(kinmin_ihrp, kinmod);
							thmmin_ihrp = min(thmmin_ihrp, thmmod);
							expmin_ihrp = min(expmin_ihrp, expmod);
							caumin_ihrp = min(caumin_ihrp, caumod);
						} else if (mtypeid === 'iscb') {
							stats.cost_restock += (slot.getEffectiveAttrValue('ammoclip') + slot.getEffectiveAttrValue('ammomax')) * (slot.getEffectiveAttrValue('ammocost') || 0);
						}

						var pwrdraw = slot.getEffectiveAttrValue('pwrdraw');
						if (!pwrdraw || slot.getPowered()) {
							var priority = slot.getPriority();
							stats.pwrdraw_dep[0] += pwrdraw;
							stats.pwrdraw_dep[priority] += pwrdraw;
							if (slotgroup !== 'hardpoint' && ((slotgroup !== 'utility') || module.passive)) {
								stats.pwrdraw_ret[0] += pwrdraw;
								stats.pwrdraw_ret[priority] += pwrdraw;
							}

							stats.jumpbst   += slot.getEffectiveAttrValue('jumpbst');
							stats.scooprate += slot.getEffectiveAttrValue('scooprate');
							stats.shieldbst += slot.getEffectiveAttrValue('shieldbst');
							stats.shieldrnf += slot.getEffectiveAttrValue('shieldrnf');

							if (slotgroup === 'hardpoint') {
								var thmload = slot.getEffectiveAttrValue('thmload');
								var distdraw = slot.getEffectiveAttrValue('distdraw');
								var ammoclip = slot.getEffectiveAttrValue('ammoclip');
								var ammomax = slot.getEffectiveAttrValue('ammomax');
								var eps = slot.getEffectiveAttrValue('eps');
								var seps = slot.getEffectiveAttrValue('seps');
								var spc = slot.getEffectiveAttrValue('spc') || 1;
								var sspc = slot.getEffectiveAttrValue('sspc') || 1;
								var sfpc = slot.getEffectiveAttrValue('sfpc');
								var sdps = slot.getEffectiveAttrValue('sdps');

								thmload *= sfpc / sspc;
								stats.thmload_hardpoint_wepfull += getEffectiveWeaponThermalLoad(thmload, distdraw, wepcap, 1.0);
								stats.thmload_hardpoint_wepempty += getEffectiveWeaponThermalLoad(thmload, distdraw, wepcap, 0.0);

								stats.dps += sdps;
								stats.dps_abs += sdps * (slot.getEffectiveAttrValue('abswgt') / 100.0);
								stats.dps_thm += sdps * (slot.getEffectiveAttrValue('thmwgt') / 100.0);
								stats.dps_kin += sdps * (slot.getEffectiveAttrValue('kinwgt') / 100.0);
								stats.dps_exp += sdps * (slot.getEffectiveAttrValue('expwgt') / 100.0);
								stats.dps_axe += sdps * (slot.getEffectiveAttrValue('axewgt') / 100.0);
								stats.dps_cau += sdps * (slot.getEffectiveAttrValue('cauwgt') / 100.0);

								weapons.push( {key:spc, spc:spc, eps:eps, seps:seps} );
								var ammotime = ammoclip ? (sspc * ((ammoclip + ammomax) / sfpc)) : 1/0;
								if (distdraw) {
									stats.dps_distdraw += sdps;
									stats.ammotime_wepcap = min(stats.ammotime_wepcap, ammotime);
								} else {
									stats.dps_nodistdraw += sdps;
									stats.ammotime_nocap = min(stats.ammotime_nocap, ammotime);
								}
							} else if (mtypeid === 'usb') {
								kinmod_usb *= (1 - (slot.getEffectiveAttrValue('kinres') / 100));
								thmmod_usb *= (1 - (slot.getEffectiveAttrValue('thmres') / 100));
								expmod_usb *= (1 - (slot.getEffectiveAttrValue('expres') / 100));
								caumod_usb *= (1 - (slot.getEffectiveAttrValue('caures') / 100));
							} else if (mtypeid === 'ct') {
								stats.thmload_ct += slot.getEffectiveAttrValue('engheat');
							} else if (mtypeid === 'cfsd' || mtypeid === 'cfsdo') {
								stats.thmload_cfsd += slot.getEffectiveAttrValue('fsdheat');
							} else if (mtypeid === 'idlc' || mtypeid === 'imlc' || mtypeid === 'irlc') {
								stats.lmprepcap_max = max(stats.lmprepcap_max, slot.getEffectiveAttrValue('lmprepcap'));
							} else if (mtypeid === 'iex') {
								stats.unlimit[module.unlimit] = (stats.unlimit[module.unlimit] || 0) + (module.unlimitcount || 0);
							} else if (mtypeid === 'iscb') {
								var scbheat = slot.getEffectiveAttrValue('scbheat');
								var spinup = slot.getEffectiveAttrValue('spinup');
								stats.thmload_iscb += scbheat / spinup;
								stats.spinup_iscb = max(stats.spinup_iscb, spinup);

								var shieldrnfps = (slot.getEffectiveAttrValue('scbdur') * slot.getEffectiveAttrValue('shieldrnfps'));
								var ammo = (slot.getEffectiveAttrValue('ammoclip') + slot.getEffectiveAttrValue('ammomax'));
								stats.shieldrnfps += shieldrnfps;
								stats.shieldrnfps_ammomax += shieldrnfps * ammo;
							} else if (mtypeid === 'isg' && !slot_isg) {
								slot_isg = slot;
							}
						}
					}
				}
			}

			// derived Totals stats
			stats.mass_hull = slot_hull.getEffectiveAttrValue('mass');
			stats.mass_unladen = stats.mass + stats.fuelcap;
			stats.mass_laden = stats.mass_unladen + stats.cargocap;

			// derived FSD stats
			var slot = this.getSlot('component', CORE_ABBR_SLOT.FD);
			var fsdopt = slot.getEffectiveAttrValue('fsdoptmass');
			var fsdfuel = slot.getEffectiveAttrValue('maxfuel');
			var fsdmul = slot.getEffectiveAttrValue('fuelmul');
			var fsdpower = slot.getEffectiveAttrValue('fuelpower');
			// fuelres does NOT count toward available jump fuel NOR total jump mass,
			// but is wrongly counted both ways by the "cur" range shown in-game in outfitting and the right-hand ship panel;
			// the "min" and "max" ranges shown there treat fuelres correctly, but pretend you can use the fsd's max fuel even if your fuel tank is smaller than that;
			// the only correct in-game current jump range display is in the advanced maintenance restock and refuel windows, but they also display current range in all three "min/cur/max" positions
			stats._jump_laden    = getJumpDistance(stats.mass + stats.cargocap,     stats.fuelcap          , fsdfuel, fsdopt, fsdmul, fsdpower, stats.jumpbst);
			stats._jump_unladen  = getJumpDistance(stats.mass                 ,     stats.fuelcap          , fsdfuel, fsdopt, fsdmul, fsdpower, stats.jumpbst);
			stats._jump_max      = getJumpDistance(stats.mass                 , min(stats.fuelcap, fsdfuel), fsdfuel, fsdopt, fsdmul, fsdpower, stats.jumpbst);
			stats._range_laden   = getJumpRange(stats.mass + stats.cargocap, stats.fuelcap, fsdfuel, fsdopt, fsdmul, fsdpower, stats.jumpbst);
			stats._range_unladen = getJumpRange(stats.mass                 , stats.fuelcap, fsdfuel, fsdopt, fsdmul, fsdpower, stats.jumpbst);

			// derived Thruster stats
			var boostcost = slot_hull.getEffectiveAttrValue('boostcost');
			var topspd = slot_hull.getEffectiveAttrValue('topspd');
			var bstspd = slot_hull.getEffectiveAttrValue('bstspd');
			var slot = this.getSlot('component', CORE_ABBR_SLOT.PD);
			var engcap = slot.getEffectiveAttrValue('engcap');
			var slot = this.getSlot('component', CORE_ABBR_SLOT.TH);
			var minmass = slot.getEffectiveAttrValue('engminmass');
			var optmass = slot.getEffectiveAttrValue('engoptmass');
			var maxmass = slot.getEffectiveAttrValue('engmaxmass');
			var minmulspd = slot.getEffectiveAttrValue('minmulspd');
			var optmulspd = slot.getEffectiveAttrValue('optmulspd');
			var maxmulspd = slot.getEffectiveAttrValue('maxmulspd');
			var effmulspd = (getMassCurveMultiplier(stats.mass + stats.fuelcap, minmass, optmass, maxmass, minmulspd, optmulspd, maxmulspd) / 100);
			stats._speed = (topspd * effmulspd);
			stats._boost = ((engcap >= (boostcost + BOOST_MARGIN)) ? (bstspd * effmulspd) : 0);

			// derived Shield stats
			var mass_hull = slot_hull.getEffectiveAttrValue('mass');
			var shields = slot_hull.getEffectiveAttrValue('shields');
			var maxmass = (slot_isg ? slot_isg.getEffectiveAttrValue('genmaxmass') : 0);
			if (slot_isg && maxmass >= mass_hull) {
				var minmass = slot_isg.getEffectiveAttrValue('genminmass');
				var optmass = slot_isg.getEffectiveAttrValue('genoptmass');
				var minmul = slot_isg.getEffectiveAttrValue('genminmul');
				var optmul = slot_isg.getEffectiveAttrValue('genoptmul');
				var maxmul = slot_isg.getEffectiveAttrValue('genmaxmul');
				var kinres = slot_isg.getEffectiveAttrValue('kinres');
				var thmres = slot_isg.getEffectiveAttrValue('thmres');
				var expres = slot_isg.getEffectiveAttrValue('expres');
				var caures = slot_isg.getEffectiveAttrValue('caures');
				var effmulshd = (getMassCurveMultiplier(mass_hull, minmass, optmass, maxmass, minmul, optmul, maxmul) / 100);
//TODO console.log(effmulshd);
				stats._shields = (
						shields
						* getEffectiveShieldBoostMultiplier(stats.shieldbst)
						* effmulshd
				) + stats.shieldrnf;
				// shield resistance is stacking-penalized EXCLUDING the generator!
				stats._skinres = getEffectiveDamageResistance(0, (1 - kinmod_usb) * 100, kinres);
				stats._sthmres = getEffectiveDamageResistance(0, (1 - thmmod_usb) * 100, thmres);
				stats._sexpres = getEffectiveDamageResistance(0, (1 - expmod_usb) * 100, expres);
				stats._scaures = getEffectiveDamageResistance(0, (1 - caumod_usb) * 100, caures);
			} else {
				stats._shields = 0;
			}

			// derived Armour stats
			var armour = slot_hull.getEffectiveAttrValue('armour');
			var slot = this.getSlot('component', CORE_ABBR_SLOT.BH);
			var kinres = slot.getEffectiveAttrValue('kinres');
			var thmres = slot.getEffectiveAttrValue('thmres');
			var expres = slot.getEffectiveAttrValue('expres');
			var caures = slot.getEffectiveAttrValue('caures');
			stats._armour = ((armour * (1 + stats.hullbst / 100)) + stats.hullrnf);
			// armour resistance is stacking-penalized INCLUDING the bulkheads!
//TODO console.log("armor kin/thm/exp/cau res");
			stats._akinres = getEffectiveDamageResistance(kinres, (1 - kinmod_ihrp) * 100, 0, (1 - kinmin_ihrp) * 100);
			stats._athmres = getEffectiveDamageResistance(thmres, (1 - thmmod_ihrp) * 100, 0, (1 - thmmin_ihrp) * 100);
			stats._aexpres = getEffectiveDamageResistance(expres, (1 - expmod_ihrp) * 100, 0, (1 - expmin_ihrp) * 100);
			stats._acaures = getEffectiveDamageResistance(caures, (1 - caumod_ihrp) * 100, 0, (1 - caumin_ihrp) * 100);
//TODO console.log("---");

			// derived Weapon stats
			var slot = this.getSlot('component', CORE_ABBR_SLOT.PD);
			var wepcap = slot.getEffectiveAttrValue('wepcap');
			var wepchg = slot.getEffectiveAttrValue('wepchg');
			var powerdist_wep = this.getEffectivePowerDist('wep');
			var powerdistWepMul = pow(powerdist_wep / MAX_POWER_DIST, 1.1);
			weapons.sort(sortObjKeyAsc);
			var eps = 0;
			var seps = 0;
			for (var i = 0;  i < weapons.length;  i++) {
				eps += weapons[i].eps;
				seps += weapons[i].seps;
			}
			var eps_cur = eps;
			var eps_max = eps;
			stats.wepcap_burst_cur = (wepcap / max(0, eps_cur - wepchg * powerdistWepMul));
			stats.wepcap_burst_max = (wepcap / max(0, eps_max - wepchg));
			for (var i = 0;  i < weapons.length;  i++) {
				if (stats.wepcap_burst_cur >= weapons[i].spc) {
					eps_cur = eps_cur - weapons[i].eps + weapons[i].seps;
					stats.wepcap_burst_cur = (wepcap / max(0, eps_cur - wepchg * powerdistWepMul));
				}
				if (stats.wepcap_burst_max >= weapons[i].spc) {
					eps_max = eps_max - weapons[i].eps + weapons[i].seps;
					stats.wepcap_burst_max = (wepcap / max(0, eps_max - wepchg));
				}
			}
			stats.wepchg_sustain_cur = min(max(wepchg * powerdistWepMul / seps, 0), 1);
			stats.wepchg_sustain_max = min(max(wepchg                   / seps, 0), 1);
		}, // updateStats()


		getStat: function(stat) {
			if (!this.stats)
				this.updateStats();
			return this.stats[stat];
		}, // getStat()


		getPrevStat: function(stat) {
			return (this.prevstats || EMPTY_OBJ)[stat];
		}, // getPrevStat()


		getHash: function() {
			if (!this.hash) {
				var slot = this.getSlot('ship', 'hull');
				var cost = (slot.hasActualCost() ? slot.getCost() : 0);
				var costbits = (cost & 0xF);
				cost >>= 4;
				var costsize = min(max(ceil(ceil(log2(cost)) / 6), 2), 5);
				costbits |= (((costsize - 2) & 0x3) << 4);
				var crewbits = (((this.crewdist.sys & 0x3) << 4) | ((this.crewdist.eng & 0x3) << 2) | (this.crewdist.wep & 0x3));
				var distbits = (((this.powerdist.sys & 0xF) << 8) | ((this.powerdist.eng & 0xF) << 4) | (this.powerdist.wep & 0xF));
				var hash = (
					hashEncode(HASH_VERSION, 1)
					+ hashEncode(this.shipid & 0x3F, 1)
					+ hashEncode(slot.getDiscounts(), 1)
					+ hashEncode(costbits, 1) + hashEncode(cost, costsize)
					+ hashEncode(crewbits, 1)
					+ hashEncode(distbits, 2)
					+ this.getSlot('ship', 'hatch').getHash()
				);
				for (var g = 0;  g < GROUPS.length;  g++) {
					var slotgroup = GROUPS[g];
					hash += ',';
					var gap = 0;
					for (var slotnum = 0;  slot = this.getSlot(slotgroup, slotnum);  slotnum++) {
						var slothash = slot.getHash();
						if (slothash) {
							hash += (gap ? hashEncode(199900+gap, 3) : '') + slothash;
							gap = 0;
						} else {
							gap++;
						}
					}
				}
				var namehash = hashEncodeT(this.name);
				var taghash = hashEncodeT(this.nametag);
				this.hash = hash + ((namehash || taghash) ? (',' + namehash + (taghash ? (',' + taghash) : '')) : '');
			}
			return this.hash;
		}, // getHash()


		getEDSYURL: function() {
			return window.location.protocol + '//' + window.location.host + window.location.pathname + '#/L=' + this.getHash();
		}, // getEDSYURL()


		exportText: function() {
			var ship = eddb.ship[this.shipid];
			if (!ship)
				return '';
			var buffer = [];

			// ship hull and cargo hatch
			var line = '[' + getTranslation('ship-'+this.shipid);
			if (this.nametag || this.name) {
				line += ',';
				if (this.nametag)
					line += ' ' + this.nametag;
				if (this.name)
					line += ' "' + this.name.replace(/"/g,'\\"') + '"';
			}
			line += ']';
			var slot = this.getSlot('ship', 'hatch');
			if (slot.getModule())
				line += ' [' + (slot.getPowered() ? '+' : '-') + formatNumText(slot.getPriority(),0) + ']';
			buffer.push(line);

			// slots
			for (var groupnum = 0;  groupnum < GROUPS.length;  groupnum++) {
				var newgroup = true;
				for (var slotnum = 0;  slot = this.getSlot(GROUPS[groupnum], slotnum);  slotnum++) {
					if (slot.getModule()) {
						line = slot.exportText();
						if (line) {
							if (newgroup) {
								buffer.push('');
								newgroup = false;
							}
							buffer.push(line);
						}
					}
				}
			}

			// stats
			buffer.push('');
			buffer.push('---');
			buffer.push('');
			var stats = [];
			var mass = this.getStat('mass');
			var fuel = this.getStat('fuelcap');
			var cargo = this.getStat('cargocap');
			stats.push([getTranslation('attr-mass'),    (formatNumText(mass, 2) + ' ' + getTranslation('unit-tons-abbr') + ' ' + getTranslation('empty'))]);
			stats.push([null,                           (formatNumText(mass + fuel + cargo, 2) + ' ' + getTranslation('unit-tons-abbr') + ' ' + getTranslation('full'))]);
			stats.push([getTranslation('stat-fuel'),    (formatNumText(fuel, 0) + ' ' + getTranslation('unit-tons-abbr'))]);
			stats.push([getTranslation('stat-cargo'),   (formatNumText(cargo, 0) + ' ' + getTranslation('unit-tons-abbr'))]);
			var cabin = this.getStat('cabincap');
			stats.push([getTranslation('stat-cabins'),  (formatNumText(cabin, 0))]);
			var speed = this.getStat('_speed');
			var boost = this.getStat('_boost');
			stats.push([getTranslation('stat-speed'),   (formatNumText(speed, 0) + ' ' + getTranslation('unit-meters-per-second-abbr') +  ' (' + formatNumText(boost, 0) + ' ' + getTranslation('boost') + ')')]);
			var jumpUnladen = this.getStat('_jump_unladen');
			var jumpLaden = this.getStat('_jump_laden');
			stats.push([getTranslation('stat-range'),   (formatNumText(jumpUnladen, 2) + ' ' + getTranslation('unit-lightyears-abbr') +  ' ' + getTranslation('unladen'))]);
			stats.push([null,                           (formatNumText(jumpLaden, 2) + ' ' + getTranslation('unit-lightyears-abbr') +  ' ' + getTranslation('laden'))]);
			var pwrcap = this.getStat('pwrcap');
			var pwrdraw = this.getStat('pwrdraw_ret')[0];
			stats.push([getTranslation('stat-power'),   (formatNumText(pwrdraw, 2) + ' ' + getTranslation('unit-megawatts-abbr') +  ' ' + getTranslation('retracted') + ' (' + formatPctText(pwrdraw / pwrcap, 0) + ')')]);
			var pwrdraw = this.getStat('pwrdraw_dep')[0];
			stats.push([null,                           (formatNumText(pwrdraw, 2) + ' ' + getTranslation('unit-megawatts-abbr') +  ' ' + getTranslation('deployed') + ' (' + formatPctText(pwrdraw / pwrcap, 0) + ')')]);
			stats.push([null,                           (formatNumText(pwrcap, 2) + ' ' + getTranslation('unit-megawatts-abbr') +  ' ' + getTranslation('available'))]);
			var shields = this.getStat('_shields');
			stats.push([getTranslation('attr-shields'), (shields ? formatNumText(shields, 1) : getTranslation('none'))]);
			var armour = this.getStat('_armour');
			stats.push([getTranslation('attr-armour'),  (armour ? formatNumText(armour, 1) : getTranslation('none'))]);
			var dps = this.getStat('dps');
			stats.push([getTranslation('attr-damage'),  (dps ? (formatNumText(dps, 1) + ' ' + getTranslation('stat-burst-dps')) : getTranslation('none'))]);
			var cost = this.getStat('cost');
			stats.push([getTranslation('stat-price'),   (formatNumText(cost, 0) + ' ' + getTranslation('unit-credits-abbr'))]);
			stats.push([getTranslation('stat-rebuy'),   (formatNumText(cost * 0.05, 0) + ' ' + getTranslation('unit-credits-abbr') + ' @ ' + formatPctText(0.95,0) + ' ' + getTranslation('insurance'))]);

			var l = 0;
			for (var s = 0;  s < stats.length;  s++)
				l = max(l, (stats[s][0] || '').length);
			for (var s = 0;  s < stats.length;  s++)
				buffer.push((stats[s][0] || '').padEnd(l) + ': ' + stats[s][1]);
			return buffer.join('\n');
		}, // exportText()


		exportJournal: function() {
			var ship = eddb.ship[this.shipid];
			if (!ship)
				return '';

			// ship hull
			var slot = this.getSlot('ship', 'hull');
			var obj = {
				"event": "Loadout",
				"Ship": (ship.fdname || '').toLowerCase(),
				"ShipName": (this.name || ''),
				"ShipIdent": (this.nametag || ''),
				"HullValue": parseInt(slot.getCost()),
				"ModulesValue": 0,
				"UnladenMass": parseFloat(this.getStat('mass').toFixed(6)),
				"CargoCapacity": parseInt(this.getStat('cargocap')),
				"MaxJumpRange": parseFloat(this.getStat('_jump_max').toFixed(6)),
				"FuelCapacity": {
					"Main": parseFloat(this.getStat('fuelcap').toFixed(6)),
					"Reserve": parseFloat(ship.fuelreserve.toFixed(6)),
				},
				"Rebuy": parseInt(this.getStat('cost') * (1 - (current.option.insurance / 10000.0))),
				"Modules": [],
			};

			// cargo hatch
			var slot = this.getSlot('ship', 'hatch');
			if (slot.getModule()) {
				obj.Modules.push({
					"Slot": "CargoHatch",
					"Item": ("ModularCargoBayDoor" + ((ship.fdid == 128049351) ? 'FDL' : '')).toLowerCase(),
					"On": !!slot.getPowered(),
					"Priority": parseInt(slot.getPriority() - 1),
				});
			}

			// slots
			var milslots = [];
			for (var groupnum = 0;  groupnum < GROUPS.length;  groupnum++) {
				for (var slotnum = 0;  slot = this.getSlot(GROUPS[groupnum], slotnum);  slotnum++) {
					var slotobj = slot.exportJournal();
					if (slotobj) {
						((GROUPS[groupnum] === 'military') ? milslots : obj.Modules).push(slotobj);
						obj.ModulesValue += parseInt(slot.getCost()) || 0;
					}
				}
			}
			if (milslots.length > 0)
				obj.Modules = obj.Modules.concat(milslots);

			return obj;
		}, // exportJournal()


		exportSLEF: function() {
			return JSON.stringify(
				[
					{
						"header": {
							"appName": "EDSY",
							"appVersion": VERSIONS[3],
							"appURL": this.getEDSYURL()
						},
						"data": this.exportJournal()
					}
				]
			);
		}, // exportSLEF()

	}; // Build.prototype


	Build.getHashShipID = function(buildhash) {
		var version = hashDecode(buildhash.slice(0, 1));
		var idmap = Build.getHashVersionMap(version);
		var shipid = hashDecode(buildhash.slice(1, 1 + ((version >= 12) ? 1 : 2)));
		return (idmap.ship[shipid] || shipid);
	}; // getHashShipID()


	Build.fromHash = function(buildhash, errors) {
		// identify version and hash chunks
		var version = hashDecode(buildhash.slice(0, 1));
		var idmap = Build.getHashVersionMap(version);
		var chunks = buildhash.slice(1).split(',');
		var hashgroup = {
			ship      : chunks[0] || '',
			hardpoint : chunks[1],
			utility   : ((version >= 9) ? chunks[2] : ''),
			component : ((version >= 9) ? chunks[3] : chunks[2]),
			military  : ((version >= 10) ? chunks[4] : ''),
			internal  : ((version >= 10) ? chunks[5] : ((version >= 9) ? chunks[4] : chunks[3])),
			name      : ((version >= 12) ? chunks[6] : ''),
			nametag   : ((version >= 12) ? chunks[7] : ''),
		};

		// ship chunk
		var i = 0;
		var shipid = hashDecode(hashgroup.ship.slice(i, i += ((version >= 12) ? 1 : 2)));
		shipid = idmap.ship[shipid] || shipid;
		if (!eddb.ship[shipid]) {
			if (errors) errors.push('Invalid ship id #' + shipid);
			return null;
		}
		var build = new Build(shipid, false);
		var slot = build.getSlot('ship', 'hull');
		var discounts = ((version >= 14) ? hashDecode(hashgroup.ship.slice(i, i += 1)) : 0);
		var cost = 0;
		if (version >= 15) {
			var costbits = hashDecode(hashgroup.ship.slice(i, i += 1));
			cost = hashDecode(hashgroup.ship.slice(i, (i += (((costbits >> 4) & 0x3) + 2))));
			cost = (cost << 4) + (costbits & 0xF);
		}
		var crewbits = ((version >= 12) ? hashDecode(hashgroup.ship.slice(i, i += 1)) : 0);
		var distbits = ((version >= 12) ? hashDecode(hashgroup.ship.slice(i, i += 2)) : 0x444);
		if (cost) {
			if (!slot.setCost(cost)) {
				if (errors) errors.push('Invalid hull cost: ' + cost);
			}
		} else {
			if (!slot.setDiscounts(discounts)) {
				if (errors) errors.push('Invalid hull discounts: ' + discounts);
			}
		}
		/* TODO? saving powerdist with build
		if (!build.setCrewDist((crewbits >> 4) & 0x3, (crewbits >> 2) & 0x3, crewbits & 0x3)) {
			if (errors) errors.push('Invalid crew assignments');
		}
		if (!build.setPowerDist((distbits >> 8) & 0xF, (distbits >> 4) & 0xF, distbits & 0xF)) {
			if (errors) errors.push('Invalid power distributor settings');
		}
		*/
		var slot = build.getSlot('ship', 'hatch');
		if (slot) {
			slot.setHash(hashgroup.ship.slice(i), version, errors, current.option.experimental || EXPERIMENTAL_IMPORT);
		} else if (errors) errors.push('Invalid slot: ship hatch');

		for (var g = 0;  g < GROUPS.length;  g++) {
			var slotgroup = GROUPS[g];
			if (!hashgroup[slotgroup])
				continue;
			for (var i = 0, j = 0, n = 0, nU = 0;  i < hashgroup[slotgroup].length;  i = j) {
				var modid = hashDecode(hashgroup[slotgroup].slice(j, j += ((version >= 9 || slotgroup !== 'component') ? 3 : 2)));
				if (modid >= 199900) {
					// before version 9 utility was part of hardpoint
					if (version < 9 && slotgroup === 'hardpoint' && shipid == 42 && nU < 4) {
						nU += modid - 199900;
					} else {
						n += modid - 199900;
					}
				} else {
					var slotbits = ((version >= 8) ? hashDecode(hashgroup[slotgroup].slice(j, j += 1)) : 0);
					var costed = ((version >= 15) ? (slotbits & 0x20) : 0);
					var discounted = ((version >= 15) ? !costed : ((version >= 14) ? (slotbits & 0x20) : 0));
					var engineered = (slotbits & 0x10);
					if (costed) {
						var costbits = hashDecode(hashgroup[slotgroup].slice(j, (j += 1)));
						j += (((costbits >> 4) & 0x3) + 2);
					} else if (discounted) {
						j += 1;
					}
					if (engineered) {
						var engbits = ((version >= 9) ? hashDecode(hashgroup[slotgroup].slice(j, j += ((version >= 12 && version <= 14) ? 3 : 2))) : 0);
						var nummods = 0;
						if (version >= 15) {
							j += 2; // bproll
							nummods = hashDecode(hashgroup[slotgroup].slice(j, j += 1));
						} else if (!(version >= 14 && (engbits & 0x20000))) { // !bprolled
							nummods = ((version >= 12) ? (engbits & 0x1F) : (engbits & 0x3F));
						}
						j += nummods * 4;
					}
					var tgtslotgroup = slotgroup;
					var tgtslotnum = 0;
					// before version 9 utility was part of hardpoint
					if (version < 9 && slotgroup === 'hardpoint' && (eddb.module[idmap.utility[modid] || modid] || EMPTY_OBJ).class == 0) {
						tgtslotgroup = 'utility';
						tgtslotnum = nU;
						nU++;
					} else {
						var slotmap = (idmap.slotnum[shipid] || EMPTY_OBJ)[slotgroup];
						tgtslotnum = (slotmap ? slotmap[n] : n);
						n++;
					}
					slot = build.getSlot(tgtslotgroup, tgtslotnum);
					if (slot) {
						slot.setHash(hashgroup[slotgroup].slice(i, j), version, errors, current.option.experimental || EXPERIMENTAL_IMPORT);
					} else if (errors) errors.push('Invalid slot: ' + tgtslotgroup + ' ' + (isNaN(tgtslotnum) ? tgtslotnum : (tgtslotnum+1)));
				}
			}
		}

		if (hashgroup.name)
			build.setName(hashDecodeT(hashgroup.name));
		if (hashgroup.nametag)
			build.setNameTag(hashDecodeT(hashgroup.nametag));
		return build;
	}; // Build.fromHash()


	Build.getHashVersionMap = function(version) {
		var idmap = cache.hashVersionMap[version];
		if (!idmap) {
			cache.hashVersionMap[version] = idmap = {
				slotnum   : {}, // slotnum[shipid][slotgroup][oldslotnum] = newslotnum
				ship      : {}, // ship[oldshipid] = newshipid
				hardpoint : {}, // hardpoint[oldmodid] = newmodid
				utility   : {}, // utility[oldmodid] = newmodid
				component : [ {}, {}, {}, {}, {}, {}, {}, {} ], // component[slotnum][oldmodid] = newmodid
				military  : {}, // military[oldmodid] = newmodid
				internal  : {}, // internal[oldmodid] = newmodid
				module    : {}, // module[oldmodid] = newmodid; for unified modid in version 9+
				blueprint : {},
				expeffect : {},
			};
			switch (version) {
			case 0:
			case 1:
				// rearranged some slots
				idmap.slotnum[31] = { hardpoint:[1,2,0] }; // Hauler hardpoint UUS -> SUU
				idmap.slotnum[41] = { hardpoint:[3,4,1,2,0] }; // Adder hardpoint UUSSM -> MSSUU
				idmap.slotnum[32] = { hardpoint:[2,3,4,0,1] }; // Type-6 hardpoint UUUSS -> SSUUU
				// accidentally used octal notation for some module IDs
				idmap.utility = {
				//  00090:  90,
						560:1060,
				//  02090:2090,
				//  03090:3090,
				};
				idmap.internal = {
					// Auto Field-Maintenance Units
						616:1150,   608:1140,   600:1130,   592:1120,   584:1110,
						680:1250,   672:1240,   664:1230,   656:1220,   648:1210,
						744:1350,   736:1340,   728:1330,   720:1320,   712:1310,
						808:1450,   800:1440,   792:1430,   784:1420,   776:1410,
						872:1550,   864:1540,   856:1530,   848:1520,   840:1510,
						936:1650,   926:1640,   920:1630,   912:1620,   904:1610,
					 1000:1750,   992:1740,   984:1730,   976:1720,   968:1710,
				//  01850:1850, 01840:1840, 01830:1830, 01820:1820, 01810:1810,
					// Cargo Racks
						104:150,    168:250,    232:350,    296:450,    360:550,    424:650,    488:750, // 00850:850,
					// Docking Computers
					 1640:3150,
					// Refineries
					 1128:2150,  1120:2140,  1112:2130,  1104:2120,  1096:2110,
					 1192:2250,  1184:2240,  1176:2230,  1169:2220,  1160:2210,
					 1256:2350,  1248:2340,  1240:2330,  1232:2320,  1224:2310,
					 1320:2450,  1312:2440,  1304:2430,  1296:2420,  1288:2410,
				};
			case 2:
				idmap.slotnum[33] = { hardpoint:[4,5,6,7,0,1,2,3] }; // Type-7 hardpoint UUUUSSSS -> SSSSUUUU
			case 3:
			case 4:
				if (version == 4) idmap.slotnum[51] = { internal:[2,3,4,5,6,7,8,9] }; // Orca internals erroneously reduced by 2 in v4, but not in prior versions
			case 5:
				idmap.ship[7] = 24; // Fer-de-Lance multipurpose -> combat
			case 6:
				idmap.hardpoint[22161] = 62171; // 1F/G Pulse Laser is actually 1G/G
			case 7:
				idmap.slotnum[4] = { hardpoint:[5,6,7,8,1,2,0,3,4] }; // Federal Dropship hardpoint UUUUMMLMM -> LMMMMUUUU
				// Bulkheads are now rating A-C instead of I
				idmap.component[CORE_ABBR_SLOT.BH] = {
					191:40131,
					192:40122,
					193:40113,
					194:40114,
					195:40115,
				};
			case 8:
				// in v9 we're unifying the mID space, requiring lots of changes to avoid conflicts

				// miscelanneous hardpoints -> 8xxxx
				idmap.hardpoint = {
					22161:62171, // 1F/G Pulse Laser from v6, just in case
					60190:80190, 61190:80191, 60290:80290, // Mine Launchers
					70140:81140, 70240:81240, 70144:81144, // Mining Lasers
					50120:82120, 50123:82123, 50220:82220, 50223:82223, 50224:82224, 50225:82225, // Missile Launchers
					24230:83230, 41320:83320, 41410:83410, 41324:83324, // Plasma Accelerators
					40140:84140, 40220:84220, 40224:84224, // Rail Guns
					51193:85193, 51293:85293, // Torpedo Pylons
				};

				// thermal and kinetic weapons -> 6xxxx - 7xxxx
				var mapBatch = [
					20150, 20151, 20162, 20240, 20241, 20252, 20330, 20331, 20332, 20410, 20411, 20154, // Beam Lasers
					21160, 21171, 21172, 21250, 21261, 21262, 21340, 21351, 21352, 21450, 21451, 21164, // Burst Lasers
					22160, 22171, 22172, 22250, 22261, 22262, 22350, 22361, 22362, 22410, 22411, 22254, // Pulse Lasers
					30140, 30151, 30162, 30240, 30241, 30252, 30330, 30331, 30342, 30420, 30421,        // Cannons
					31150, 31151, 31152, 31210, 31241, 31242, 31330, 31331, 31332,               31334, // Fragment Cannons
					32160, 32171, 32172, 32250, 32261, 32262, 32330, 32331,        32410, 32411,        // Multi-cannons
				];
				for (var i = 0;  i < mapBatch.length;  i++) {
					idmap.hardpoint[mapBatch[i]] = mapBatch[i] + 40000;
				}
				idmap.hardpoint[30144] = 72144; // Enforcer Cannon is not actually a Cannon but a Multi-cannon

				// Chaff, ECM, Heat Sink, Point Defence, Shield Boosters -> 50xxx - 54xxx
				var mapBatch = [90, 1060, 2090, 3090, 4050, 4040, 4030, 4020, 4010];
				for (var i = 0;  i < mapBatch.length;  i++) {
					idmap.utility[mapBatch[i]] = mapBatch[i] + 50000;
				}

				// Manifest, Wake, Kill Warrant Scanners -> 55xxx - 57xxx
				var mapBatch = [
					14050, 14040, 14030, 14020, 14010,
					15050, 15040, 15030, 15020, 15010,
					16050, 16040, 16030, 16020, 16010
				];
				for (var i = 0;  i < mapBatch.length;  i++) {
					idmap.utility[mapBatch[i]] = mapBatch[i] + 41000;
				}

				// all core components -> 40xxx - 47xxx
				var mapBatch = [
					131, 122, 113, 114, 115, // Bulkheads
					211, 311, // special Thrusters
					150, 140, 130, 120, 110,
					250, 240, 230, 220, 210,
					350, 340, 330, 320, 310,
					450, 440, 430, 420, 410,
					550, 540, 530, 520, 510,
					650, 640, 630, 620, 610,
					750, 740, 730, 720, 710,
					850, 840, 830, 820, 810
				];
				for (var slot = 0;  slot < eddb.group.component.length;  slot++) {
					for (var i = 0;  i < mapBatch.length;  i++) {
						idmap.component[slot][mapBatch[i]] = 40000 + (1000 * slot) + mapBatch[i];
					}
				}

				// Frame Shift Drive Interdictors, Hatch Breaker Limpet Controllers -> 25xxx - 26xxx
				var mapBatch = [
					40150, 40140, 40130, 40120, 40110,
					40250, 40240, 40230, 40220, 40210,
					40350, 40340, 40330, 40320, 40310,
					40450, 40440, 40430, 40420, 40410,
					41150, 41140, 41130, 41120, 41110,
					41350, 41340, 41330, 41320, 41310,
					41550, 41540, 41530, 41520, 41510,
					41750, 41740, 41730, 41720, 41710
				];
				for (var i = 0;  i < mapBatch.length;  i++) {
					idmap.internal[mapBatch[i]] = mapBatch[i] - 15000;
				}

				// optional Fuel Tanks -> 47xxx
				var mapBatch = [21130, 21230, 21330, 21430, 21530, 21630, 21730, 21830];
				for (var i = 0;  i < mapBatch.length;  i++) {
					idmap.internal[mapBatch[i]] = mapBatch[i] + 26000;
				}
			case 9:
			case 10:
				idmap.slotnum[34] = { internal:[0,2,3,4,5,6,7,8,9] }; // Type-9 gains size 8 internal
			case 11:
				var bp_misc = [null,null,null,'misc_sh4'];
				var bp_lmpt = [null,'misc_lw','misc_rf','misc_sh'];
				idmap.blueprint = {
					ucl   : ['ucl_ammo','misc_lw','misc_rf','misc_sh'],
					uhsl  : ['uhsl_ammo','misc_lw','misc_rf','misc_sh'],
					upd   : ['upd_ammo','misc_lw','misc_rf','misc_sh'],
					usb   : ['usb_br','usb_hd','usb_kr','usb_ra','usb_tr'],
					cls   : [null,'misc_lw','misc_rf','misc_sh'],
					cs    : [null,'cs_lw',null,null,'cs_lr','cs_wa'],
					iafmu : bp_misc,
					iclc  : bp_lmpt,
					ifs   : bp_misc,
					iftlc : bp_lmpt,
					ihblc : bp_lmpt,
					iplc  : bp_lmpt,
					ir    : bp_misc,
					iss   : [null,null,null,null,'iss_lr','iss_wa','iss_fs'],
				};
				var bp_hdpt = ['wpn_ds','wpn_eff','wpn_foc','wpn_hc','wpn_lw','wpn_lr','wpn_oc','wpn_rf','wpn_sr','wpn_stu'];
				for (var mtypeid in eddb.group.hardpoint.mtypes) {
					if (!idmap.blueprint[mtypeid])
						idmap.blueprint[mtypeid] = bp_hdpt;
				}
				var bp_util = [null,'misc_lw','misc_rf','misc_sh','scan_lr','scan_wa','scan_fs'];
				for (var mtypeid in eddb.group.utility.mtypes) {
					if (!idmap.blueprint[mtypeid])
						idmap.blueprint[mtypeid] = bp_util;
				}
			case 12:
				// from edshipyard.net
				idmap.ship[60] = 13; // Alliance Challenger
				idmap.ship[63] = 14; // Krait Mk II
				idmap.module = {
					88221:88140, 88224:88143, 88256:88345, 88258:88146, 88259:88216, // Guardian Gauss Cannon, Guardian Plasma Charger, Guardian Shard Cannon
					24758:81141, 24749:81143, 24709:81225, 24699:81226, 24739:81127, 24729:81227, 24719:81228, // Abrasion Blaster, Seismic Charge Launcher, Sub-surface Displacement Missile
					82215:82313, // 3A/F Seeker Missile Rack
					40000:59050, 40001:59040, 40002:59030, 40003:59020, 40004:59010, // Pulse Wave Analyser
					16819:12180, 16818:12280, 16817:12380, 16816:12480, 16815:12580, // Guardian Frame Shift Drive Booster
					10662:32151, 10661:32141, 10660:32251, 10659:32241, 10658:32351, 10657:32341, 10656:32451, 10655:32441, 10654:32551, 10653:32541, // Guardian Shield Reinforcement Package
					88350: 8151, 88349: 8141, 88348: 8251, 88347: 8241, 88346: 8351, 88345: 8341, 88344: 8451, 88343: 8441, 88342: 8551, 88341: 8541, // Guardian Module Reinforcement Package
				};
				// from edshipyard.com/new
				idmap.slotnum[43] = { hardpoint:[2,3,0,1] }; // Diamondback Scout hardpoint SSMM -> MMSS
				idmap.slotnum[35] = { hardpoint:[2,3,0,1] }; // Keelback hardpoint SSMM -> MMSS
				idmap.slotnum[45] = { hardpoint:[2,3,0,1] }; // Asp Scout hardpoint SSMM -> MMSS
				idmap.slotnum[42] = { hardpoint:[2,3,4,5,0,1] }; // Asp Explorer hardpoint SSSSMM -> MMSSSS
				idmap.slotnum[36] = { hardpoint:[4,5,6,0,1,2,3,7,8] }; // Type-10 hardpoint MMMLLLLSS -> LLLLMMMSS
				idmap.slotnum[62] = { hardpoint:[3,4,5,6,1,2,0] }; // Imperial Cutter hardpoint MMMMLLH -> HLLMMMM
				idmap.module[10130] = -1; // Advanced Discovery Scanner
				idmap.module[10140] = -1; // Intermediate Discovery Scanner
				idmap.module[10150] = -1; // Basic Discovery Scanner
				if (!idmap.blueprint['iss'])
					idmap.blueprint['iss'] = [];
				idmap.blueprint['iss'][0] = 'iss_er';
				idmap.blueprint['iss'][1] = 'iss_er';
				idmap.blueprint['iss'][2] = 'iss_er';
			case 13:
			case 14:
			case 15:
			case 16:
				idmap.module[86220] = 86250; // AX Missile Rack
				idmap.module[86222] = 86262; // AX Missile Rack
				idmap.module[86310] = 86330; // AX Missile Rack
				idmap.module[86312] = 86352; // AX Missile Rack
			case 17:
			case 18:
				idmap.slotnum[46] = { hardpoint:[4,5,0,1,2,3] }; // Mandalay hardpoint SSMMMM -> MMMMSS
			case 19:
				idmap.slotnum[32] = idmap.slotnum[32] || {};
				idmap.slotnum[32].internal = [1,2,3,4,5,6,7,8,9]; // Type-6 gains size 6 internal
				idmap.slotnum[33] = idmap.slotnum[33] || {};
				idmap.slotnum[33].internal = [2,3,4,5,6,7,8,9,10,11]; // Type-7 gains size 7 and 6 internals
				idmap.slotnum[3] = idmap.slotnum[3] || {};
				idmap.slotnum[3].internal = [1,2,3,4,5,6,7,8,9]; // Imperial Clipper gains size 7 internal
				idmap.slotnum[4] = idmap.slotnum[4] || {};
				idmap.slotnum[4].internal = [1,2,3,4,5,6,7,8,9]; // Federal Dropship gains size 6 internal
			case 20: // HASH_VERSION
			default:
			}
		}
		return idmap;
	}; // Build.getHashVersionMap()


	Build.fromJournal = function(json, errors, slefheader) {
		var fdevmap = getFdevImportMap();
		var shipid = fdevmap.ship[json.Ship.trim().toUpperCase()];
		var ship = eddb.ship[shipid];
		if (!ship) {
			if (errors) errors.push('Invalid ship: ' + json.Ship);
			return null;
		}

		var build = new Build(shipid);
		if (json.ShipName && !build.setName(json.ShipName)) {
			if (errors) errors.push('Invalid ship name: ' + json.ShipName);
		}
		if (json.ShipIdent && !build.setNameTag(json.ShipIdent)) {
			if (errors) errors.push('Invalid ship ID: ' + json.ShipIdent);
		}
		if (slefheader && (slefheader['appName'] || '').trim().toUpperCase() === 'INARA') {
			var inaraAcct = (slefheader['appCustomProperties'] || EMPTY_OBJ)['inaraCommanderID'];
			var inaraShip = (slefheader['appCustomProperties'] || EMPTY_OBJ)['inaraShipID'];
			if (!build.setInaraXref(inaraAcct, inaraShip)) {
				if (errors) errors.push('Invalid Inara xref: ' + inaraAcct + '/' + inaraShip);
			}
		}

		// build and align slot index maps
		var extravalue = 0;
		var groupSlotnames = { ship:[] };
		var groupSlotnums = { ship:[] };
		for (var slotgroup in eddb.group) {
			groupSlotnames[slotgroup] = [];
			groupSlotnums[slotgroup] = [];
			for (var s = 0;  s < ship.slots[slotgroup].length;  s++)
				groupSlotnums[slotgroup].push(s);
		}
		var slotModule = {};
		var slotNum = {};
		var slotSize = {};
		for (var m = 0;  m < (json.Modules || EMPTY_ARR).length;  m++) {
			var modulejson = json.Modules[m];
			var slotname = (modulejson.Slot || '').trim().toUpperCase();
			var tokens = slotname.match(/^([A-Z]+)([0-9]*)(?:_SIZE([0-9]+))?$/);
			var slotgroup = fdevmap.slotGroup[(tokens || EMPTY_OBJ)[1]];
			if (groupSlotnames[slotgroup]) {
				groupSlotnames[slotgroup].push(slotname);
				slotModule[slotname] = modulejson;
				slotNum[slotname] = fdevmap.slotNum[slotname] || parseInt(tokens[2] || 0);
				if ((ship.slotnames || EMPTY_OBJ)[slotgroup]) {
					// if the ship has irregular slotnames, try to look it up that way
					for (var n = 0;  n < ship.slotnames[slotgroup].length;  n++) {
						if ((ship.slotnames[slotgroup][n] || '').toUpperCase() == slotname) {
if(false && current.dev) console.log("Build.fromJournal(): matched slot "+slotname+" to "+slotgroup+ " #"+n+" instead of "+slotNum[slotname]);
							slotNum[slotname] = n;
							break;
						}
					}
				}
				slotSize[slotname] = ((slotgroup === 'hardpoint') ? 'TSMLH'.indexOf(slotname[0]) : parseInt(tokens[3] || 0));
				// since the slot size could be misreported by the slot name, take the greater of that or the size of the actual slotted module, if any
				if (modulejson) {
					var fdname = (modulejson.Item || '').trim().toUpperCase();
					var modid = (fdevmap.shipModule[shipid] || EMPTY_OBJ)[fdname] || fdevmap.module[fdname];
					var module = eddb.module[modid];
					if (module)
						slotSize[slotname] = max(slotSize[slotname], (module.class || 0) | 0);
				}
			} else if (slotname === 'PLANETARYAPPROACHSUITE') {
				/* ignore the approach suite; someday maybe we'll handle it, til then we'll just pretend it doesn't exist
				var fdname = (modulejson.Item || '').trim().toUpperCase();
				if (fdname === 'INT_PLANETAPPROACHSUITE') {
					extravalue += (modulejson.Value || 0);
				}
				*/
			} else if (slotname === 'CARGOHATCH') {
				// special handling for the cargo hatch, just for powered and priority settings
				var slot = build.getSlot('ship', 'hatch');
				var fdname = (modulejson.Item || '').trim().toUpperCase();
				if (fdname === 'MODULARCARGOBAYDOOR' || fdname === 'MODULARCARGOBAYDOORFDL') {
					if (!slot.setPowered(modulejson.On)) {
						if (errors) errors.push(modulejson.Slot + ': Invalid powered setting: ' + modulejson.On);
					}
					if (!slot.setPriority(parseInt(modulejson.Priority) + 1)) {
						if (errors) errors.push(modulejson.Slot + ': Invalid priority setting: ' + modulejson.Priority);
					}
				} else if (errors) errors.push(modulejson.Slot + ': Invalid module: ' + modulejson.Item);
			}
		}

		// get the hull and module costs
		if ('HullValue' in json) {
			// this does not seem to be modified by HullHealth
			var slot = build.getSlot('ship', 'hull');
			if (!slot.setCost((json.HullValue || 0) + extravalue)) {
				if (errors) errors.push('Invalid hull value: ' + json.HullValue + '+' + extravalue);
			}
		}
		var modulesValueExpected = json['ModulesValue'];
		var modulesValueActual = 0;

		for (var slotgroup in eddb.group) {
			if (slotgroup !== 'component') {
				// sort by descending size, then ascending index
				groupSlotnames[slotgroup].sort(function(n1,n2) { return ((slotSize[n1] != slotSize[n2]) ? (slotSize[n2] - slotSize[n1]) : (slotNum[n1] - slotNum[n2])); });
				groupSlotnums[slotgroup].sort(function(s1,s2) { return ((ship.slots[slotgroup][s1] != ship.slots[slotgroup][s2]) ? (ship.slots[slotgroup][s2] - ship.slots[slotgroup][s1]) : (s1 - s2)); });
				// if import slots are too few, add gaps starting with the last one that can't be shifted
				var numgaps = groupSlotnums[slotgroup].length - groupSlotnames[slotgroup].length;
				if (numgaps > 0) {
					var slotmove = [];
					for (var i = 0;  i < groupSlotnames[slotgroup].length;  i++) {
						slotmove[i] = numgaps;
						while (slotmove[i] > 0 && slotSize[groupSlotnames[slotgroup][i]] > ship.slots[slotgroup][groupSlotnums[slotgroup][i + slotmove[i]]])
							slotmove[i]--;
					}
					var gaps = [];
					while (gaps.length < numgaps) {
						var i = slotmove.length;
						while (i > 0 && slotmove[i - 1] > gaps.length)
							i--;
						gaps.push(i);
					}
					while (gaps.length > 0)
						groupSlotnames[slotgroup].splice(gaps.pop(), 0, null);
				} else if (numgaps < 0) {
					errors.push('Too many ' + slotgroup + ' slots');
				}
			}
		}

		// map and decode import slots
		for (var slotgroup in eddb.group) {
			for (var i = 0, s = 0;  i < groupSlotnames[slotgroup].length && s < groupSlotnums[slotgroup].length;  i++, s++) {
				var modulejson = slotModule[groupSlotnames[slotgroup][i]];
				if (modulejson) {
					var slotnum = ((slotgroup === 'component') ? slotNum[groupSlotnames[slotgroup][i]] : groupSlotnums[slotgroup][s]);
					var slot = build.getSlot(slotgroup, slotnum);
					if (slot) {
						var fdname = (modulejson.Item || '').trim().toUpperCase();
						var modid = (fdevmap.shipModule[shipid] || EMPTY_OBJ)[fdname] || fdevmap.module[fdname];
						if (modid > 0) {
							if (slot.setModuleID(modid, true)) {
								if (!current.option.experimental && !slot.setModuleID(modid)) {
									if (errors) errors.push(modulejson.Slot + ': ' + getModuleLabel(slot.getModule()) + ' requires Experimental Mode');
								}
								// module Value is penalized by Health!
								if (('Value' in modulejson) && modulejson['Health']) {
									modulesValueExpected -= modulejson.Value / modulejson.Health;
									if (!slot.setCost(modulejson.Value)) {
										if (errors) errors.push(modulejson.Slot + ': Invalid value: ' + modulejson.Value);
									}
								} else {
									modulesValueActual += slot.getCost();
								}
								var mtypeid = slot.getModule().mtype;
								if (modulejson.Engineering) {
									var fdname = (modulejson.Engineering.BlueprintName || '').trim().toUpperCase();
									var bpid = (fdevmap.mtypeBlueprint[mtypeid] || EMPTY_OBJ)[fdname];
									var bpgrade = 0;
									var bproll = 0;
									if (bpid) {
										bpgrade = parseInt(modulejson.Engineering.Level);
										// pre-3.0 utility ammo blueprints only had a grade 3, which now has to be grade 1
										if (fdname === 'CHAFFLAUNCHER_CHAFFCAPACITY' || fdname === 'HEATSINKLAUNCHER_HEATSINKCAPACITY' || fdname === 'POINTDEFENCE_POINTDEFENSECAPACITY')
											bpgrade = 1;
										bproll = parseFloat(modulejson.Engineering.Quality);
										if (isNaN(bproll) || bproll <= 0)
											bproll = 0;
										if (!slot.setBlueprint(bpid, bpgrade, bproll)) {
											if (errors) errors.push(modulejson.Slot + ': Invalid blueprint: ' + modulejson.Engineering.BlueprintName);
										}
									} else if (modulejson.Engineering.BlueprintName && errors) errors.push(modulejson.Slot + ': Unknown blueprint: ' + modulejson.Engineering.BlueprintName);

									var expid = fdevmap.expeffect[(modulejson.Engineering.ExperimentalEffect || '').trim().toUpperCase()];
									if (expid) {
										if (!slot.setExpeffectID(expid)) {
											if (errors) errors.push(modulejson.Slot + ': Invalid experimental: ' + modulejson.Engineering.ExperimentalEffect);
										}
									} else if (modulejson.Engineering.ExperimentalEffect && errors) errors.push(modulejson.Slot + ': Unknown experimental: ' + modulejson.Engineering.ExperimentalEffect);

									// if there are any individual attribute modifiers, apply them over the blueprint baseline
									if ((modulejson.Engineering.Modifiers || EMPTY_ARR).length > 0) {
										var bpmods = slot.getAllBaseAttrModifiers();
if (false && current.dev) console.log(json.Ship+' '+modulejson.Item+' '+bpid+' g'+bpgrade+' @'+bproll+': '+ JSON.stringify(bpmods)); // TODO DEBUG

										// if there's a DPS modifier, it's redundant with Damage and/or ROF modifiers *except for beam weapons* -- in that case, it's the only one present
										// if there's a ROF modifier, handle it last so it takes into account bstsize/bstrof
										var modlist = [];
										var modjson_dmg = null;
										var modjson_dps = null;
										var modjson_rof = null;
										for (var m = 0;  m < modulejson.Engineering.Modifiers.length;  m++) {
											var modjson = modulejson.Engineering.Modifiers[m];
											var attr = fdevmap.fieldAttr[modjson.Label];
											if (modjson.Label === 'RateOfFire') {
												modjson_rof = modjson;
											} else if (modjson.Label === 'DamagePerSecond') {
												modjson_dps = modjson;
											} else if (attr) {
												if (attr === 'damage') {
													modjson_dmg = modjson;
													if (bpid === 'wpn_aagf' || bpid === 'misc_agzr') {
														// Damage modifiers on Anti-Guardian Zone Resistance blueprints were retroactively removed
														continue;
													}
												}
												modlist.push(modjson);
											}
										}
										if (modjson_dps && !modjson_rof && !modjson_dmg) {
											modjson_dps.Label = 'Damage';
											modlist.push(modjson_dps);
										}
										if (modjson_rof) {
											modlist.push(modjson_rof);
										}

										// apply modifiers
										for (var m = 0;  m < modlist.length;  m++) {
											var modjson = modlist[m];
											var attr = fdevmap.fieldAttr[modjson.Label];
											if (attr) {
												var module = slot.getModule();
												var base = parseFloat(modjson.OriginalValue);
												if (isNaN(base))
													base = slot.getBaseAttrValue(attr);
else if(current.dev && abs(base - slot.getBaseAttrValue(attr)) > 0.00001) console.log(modulejson.Item+' '+attr+' base '+modjson.OriginalValue+' vs expected '+slot.getBaseAttrValue(attr));
												var modifier = getAttrModifier(attr, base, parseFloat(modjson.Value));
												if (!isModuleAttrModifiable(module, attr)) {
													// ignore unmodifiable attributes, Journal includes them all the time (mass on lightweight bulkheads, shotspd, etc)
if (false && current.dev) console.log(modulejson.Item+' '+attr+':'+modifier+' unmodifiable');
												} else if (abs(slot.getEffectiveAttrModifier(attr) - modifier) < 0.000005) {
if (false && current.dev) console.log(json.Ship+' '+modulejson.Item+' '+attr+' rolled '+slot.getEffectiveAttrModifier(attr)+', skipping specified '+modifier);
													if (bpmods) delete bpmods[attr];
													if (bpmods && attr === 'rof') delete bpmods['bstint'];
												} else if (!slot.setEffectiveAttrModifier(attr, modifier)) {
													if (errors) errors.push(modulejson.Slot + ': Invalid modifier: ' + modjson.Label + '=' + modjson.Value);
												} else {
if (false && current.dev) { // TODO DEBUG
var attrroll = getBlueprintGradeAttrModifierRoll(bpid, bpgrade, attr, slot.getBaseAttrModifier(attr));
if (attrroll && abs(attrroll - bproll) > 0.0001) console.log(json.Ship+' '+modulejson.Item+' '+attr+' roll '+attrroll+' vs '+bproll+', error '+(attrroll - bproll)+' curve '+(log(attrroll) / log(bproll)));
}
													if (bpmods) delete bpmods[attr];
													if (bpmods && attr === 'rof') delete bpmods['bstint'];
												}
											} else if (attr !== null && errors) errors.push(modulejson.Slot + ': Modifier #' + (m+1) + ': Unknown attribute: ' + modjson.Label);
										}

										// check for blueprint modifiers that weren't specified individually; if any, this is probably a special pre-engineered module
										for (var attr in (bpmods || EMPTY_OBJ)) {
											if (bpmods[attr]) {
if (true && current.dev) console.log(json.Ship+' '+modulejson.Item+' leftover '+attr+':'+bpmods[attr]+' modifier'); // TODO DEBUG
												slot.setAttrModifier(attr, 0);
												slot.setBlueprintRoll(0);
											}
										}
									}

									// if the resulting builtinhash matches an actual builtin, reset slot hash to that builtin (to apply its pre-eng, price, powered, priority, etc)
									var builtin = cache.modulehashBuiltin[slot.getBuiltinHash()];
									if (builtin && !slot.setStoredHash(BUILTIN_STORED_MODULES[builtin].modulehash)) {
										if (errors) errors.push(modulejson.Slot + ': Failed to match builtin "'+BUILTIN_STORED_MODULES[builtin].name+'"');
									}
								}
							} else if (errors) errors.push(modulejson.Slot + ': Invalid module: ' + modulejson.Item);
						} else if (!modid && modulejson.Item && errors) errors.push(modulejson.Slot + ': Unknown module: ' + modulejson.Item);

						if (!slot.setPowered(modulejson.On)) {
							if (errors) errors.push(modulejson.Slot + ': Invalid powered setting: ' + modulejson.On);
						}

						if (!slot.setPriority(parseInt(modulejson.Priority) + 1)) {
							if (errors) errors.push(modulejson.Slot + ': Invalid priority setting: ' + modulejson.Priority);
						}
					} else if (errors) errors.push(modulejson.Slot + ': Invalid slot');
				}
			}
		}

		// check modules value
		if (!isNaN(modulesValueExpected) && !isNaN(modulesValueActual) && modulesValueExpected != modulesValueActual && modulesValueActual > 0) {
			var discounts = getClosestDiscount(modulesValueExpected / modulesValueActual);
			if (discounts > 0) {
				for (var slotgroup in eddb.group) {
					for (var slotnum = 0;  slot = build.getSlot(slotgroup, slotnum);  slotnum++) {
						if (!slot.hasActualCost()) {
							slot.setDiscounts(discounts);
						}
					}
				}
				if (errors) errors.push(getTranslation('interp-estimated-percent-discount', {'percent':(1 - cache.discountMod[discounts]),'percent%':true,'percent#':1}));
			}
		}

		return build;
	}; // Build.fromJournal()


	Build.fromCAPI = function(shipobj, errors, unknowns) {
		var fdevmap = getFdevImportMap();
		var shipid = fdevmap.ship[shipobj["name"].trim().toUpperCase()];
		var eventobj = {
			"event": "Loadout",
			"Ship": shipobj["name"],
			"ShipID": (shipobj["id"] | 0),
			"ShipName": shipobj["shipName"],
			"ShipIdent": shipobj["shipID"],
			"HullValue": (shipobj["value"] || EMPTY_OBJ)["hull"],
			"ModulesValue": (shipobj["value"] || EMPTY_OBJ)["modules"],
		//  "Rebuy": undefined, // not returned by CAPI
		};
		for (var slotname in (shipobj["modules"] || EMPTY_OBJ)) {
			var slotobj = shipobj["modules"][slotname];
			var moduleobj = slotobj["module"];
			if (moduleobj) {
				var eventslotobj = {
					"Slot": slotname,
					"Item": moduleobj["name"],
				//  "ItemID": moduleobj["id"], // not actually part of the Journal Loadout spec
					"On": moduleobj["on"],
					"Priority": moduleobj["priority"],
					"Health": parseFloat(moduleobj["health"]) / 1000000,
					"Value": moduleobj["free"] ? 0 : moduleobj["value"],
				};
				var engineerobj = (slotobj["engineer"] || (moduleobj || EMPTY_OBJ)["modifiers"]);
				var modifierobj = (slotobj["modifications"] || slotobj["WorkInProgress_modifications"]);
				var modifierarr = (engineerobj || EMPTY_OBJ)["modifiers"];
				var specialobj = slotobj["specialModifications"];
				if (engineerobj || modifierobj || modifierarr || specialobj) {
					var modulename = (moduleobj["name"] || '').trim();
					var fdname = modulename.toUpperCase();
					var modid = (fdevmap.shipModule[shipid] || EMPTY_OBJ)[fdname] || fdevmap.module[fdname];
					var module = cache.shipModules[shipid][modid] || eddb.module[modid];
					var eventengobj = {
						"Engineer": (engineerobj || EMPTY_OBJ)["engineerName"],
						"EngineerID": (engineerobj || EMPTY_OBJ)["engineerId"],
						"BlueprintID": (engineerobj || EMPTY_OBJ)["recipeID"], // before 2.3
						"BlueprintName": ((engineerobj || EMPTY_OBJ)["recipeName"] || (moduleobj || EMPTY_OBJ)["recipeName"]),
						"Level": ((engineerobj || EMPTY_OBJ)["recipeLevel"] || (moduleobj || EMPTY_OBJ)["recipeLevel"]),
					//  "Quality": undefined, // not returned by CAPI
						"Modifiers": [],
					};

					var modifiers = {};
					var mod_weapon_falloffrange_from_range = false;

					if (modifierobj) { // after 2.4
						for (var field in modifierobj) {
							// 'field' has OutfittingFieldType_ / Override_ prefix
							var attr = fdevmap.fieldAttr[field.slice(field.indexOf('_') + 1)];
							var modifier = parseFloat(modifierobj[field]["value"]);
							if (attr === 'rof') {
								attr = 'bstint';
								modifier = (1 / (modifier - 1)) + 1;
							}
							var attribute = cache.attribute[attr];
							if (attr === null || (attr && !isModuleAttrModifiable(module, attr))) {
								// ignore
							} else if (attribute) {
								if (attribute.modmod && attr !== 'shieldbst') {
									// CAPI returns modmods (except shieldbst) as final effective values rather than modifiers to base values
									modifiers[attr] = getModuleAttrModifier(module, attr, attribute.modmod * (modifier - 1));
								} else {
									modifiers[attr] = (attribute.modset ? modifier : getAttrModifierSum(attr, modifiers[attr], modifier - 1));
								}
							} else if (unknowns) {
								var tag = slotname + ': ' + modulename;
								if (!unknowns[tag])
									unknowns[tag] = {};
								unknowns[tag][field] = 1;
							} else if (errors) {
								errors.push(slotname + ': ' + modulename + ': Unknown obj field: ' + field);
							}
						}
					}

					if (modifierarr) { // before 2.3
						for (var m = 0;  m < modifierarr.length;  m++) {
							var field = modifierarr[m].name;
							var fieldmodifier = parseFloat(modifierarr[m].value);
							var attrmods = eddb.fdattrmod[field];
							var expid = fdevmap.expeffect[field.toUpperCase()];
							if (field === 'mod_weapon_clip_size_override') {
								modifiers['ammoclip'] = getModuleAttrModifier(module, 'ammoclip', fieldmodifier);
							} else if (field === 'mod_weapon_falloffrange_from_range') {
								mod_weapon_falloffrange_from_range = true;
							} else if (attrmods) {
								for (var attr in attrmods) {
									var attribute = cache.attribute[attr];
									var modifier = fieldmodifier * attrmods[attr];
									modifiers[attr] = (attribute.modset ? modifier : getAttrModifierSum(attr, modifiers[attr], modifier));
								}
							} else if (expid) {
								specialobj = specialobj || {};
								specialobj[field] = fieldmodifier;
							} else if (unknowns) {
								var tag = slotname + ': ' + modulename;
								if (!unknowns[tag])
									unknowns[tag] = {};
								unknowns[tag][field] = 1;
							} else if (errors) {
								errors.push(slotname + ': ' + modulename + ': Unknown arr field: ' + field);
							}
						}
					}

					if (specialobj) {
						for (var field in specialobj) {
							if (module.mtype === 'hrg' && (field === 'special_feedback_cascade' || field === 'special_plasma_slug' || field === 'special_super_penetrator'))
								field += '_cooled';
							eventengobj["ExperimentalEffect"] = field;
							var expid = fdevmap.expeffect[field.toUpperCase()];
							var expeffect = eddb.expeffect[expid];
							if (expeffect) {
								for (var attr in expeffect) {
									var attribute = cache.attribute[attr];
									var modifier = expeffect[attr];
									if (!isModuleAttrModifiable(module, attr)) {
										// ignore
									} else if (modifier) {
										modifier /= ((attribute.modset || attribute.modadd) ? 1 : (attribute.modmod || 100));
										modifiers[attr] = (attribute.modset ? modifier : getAttrModifierSum(attr, modifiers[attr], modifier));
									}
								}
							} else if (unknowns) {
								var tag = slotname + ': ' + modulename;
								if (!unknowns[tag])
									unknowns[tag] = {};
								unknowns[tag][field] = 1;
							} else if (errors) {
								errors.push(slotname + ': ' + modulename + ': Unknown special: ' + field);
							}
						}
					}

					if (mod_weapon_falloffrange_from_range && modifiers['maximumrng']) {
						modifiers['dmgfall'] = getModuleAttrModifier(module, 'dmgfall', getModuleAttrValue(module, 'maximumrng', modifiers['maximumrng']));
					}
					if (modifiers['bstint']) {
						// translate bstint back to rof, considering modified bstsize/bstrof
						var duration = 0; // TODO: verify that CAPI bstint modifier assumes 0 charge time for variable charge (dmgmul) weapons
						var bstsize = getModuleAttrValue(module, 'bstsize', modifiers['bstsize']);
						var bstrof = getModuleAttrValue(module, 'bstrof', modifiers['bstrof']);
						var bstint = getModuleAttrValue(module, 'bstint', modifiers['bstint']);
						var rof = (bstsize / ((bstsize / bstrof) + max(0, bstint - 1 / bstrof) + duration)) * (1 + (modifiers['rof'] || 0));
						modifiers['rof'] = getModuleAttrModifier(module, 'rof', rof);
						delete modifiers['bstint'];
					}

					for (var attr in modifiers) {
						var modifier = modifiers[attr];
						var field = fdevmap.attrField[attr];
						if (modifier && field) {
							eventengobj["Modifiers"].push({
								"Label": field,
								"Value": getModuleAttrValue(module, attr, modifier),
							});
						}
					}

					eventslotobj["Engineering"] = eventengobj;
				}
				if (!eventobj["Modules"])
					eventobj["Modules"] = [];
				eventobj["Modules"].push(eventslotobj);
			}
		}
		return Build.fromJournal(eventobj, errors);
	}; // Build.fromCAPI()

