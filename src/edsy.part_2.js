
	/*
	* MODULES & ATTRIBUTES
	*/


	var getAttrValue = function(attr, value, modifier) {
		var attribute = cache.attribute[attr];
		if (attribute) {
			// fall back on attribute default value
			if (value === undefined && !isNaN(attribute.default))
				value = attribute.default;

			// apply modifier?
			if (modifier && !isNaN(value) && (value || attribute.modset || attribute.modadd || attribute.modmod)) {
				if (attribute.modset) {
					value = modifier;
				} else if (attribute.modadd) {
					value = value + modifier;
				} else if (attribute.modmod) {
					value = ((1 + (value / attribute.modmod)) * (1 + modifier) - 1) * attribute.modmod;
				} else {
					value = value * (1 + modifier);
				}

				// apply constraints
				if (attribute.step)
					value = round(value / attribute.step) * attribute.step;
				if (attribute.min !== undefined)
					value = max(value, attribute.min);
				if (attribute.max !== undefined)
					value = min(value, attribute.max);
			}
		}
		return value;
	}; // getAttrValue()


	var getAttrModifier = function(attr, base, value) {
		var attribute = cache.attribute[attr];
		if (!attribute || isNaN(value) || value == base)
			return undefined;
		if (attribute.modset)
			return value;
		if (attribute.modadd)
			return value - base;
		if (attribute.modmod)
			return (((1 + (value / attribute.modmod)) / (1 + (base / attribute.modmod))) - 1);
		return ((value / base) - 1);
	}; // getAttrModifier()


	var getAttrModifierDirection = function(attr, modifier) {
		if (!modifier || isNaN(modifier))
			return 0;
		var attribute = cache.attribute[attr];
		return (modifier * (attribute.modmod || 1) * (attribute.bad ? -1 : 1));
	}; // getAttrModifierDirection()


	var getAttrModifierSum = function(attr, modifier1, modifier2) {
		if (!modifier1 || !modifier2)
			return (modifier2 || modifier1);
		var attribute = cache.attribute[attr];
		if (attribute.modset)
			return modifier2;
		if (attribute.modadd)
			return modifier1 + modifier2;
		// modmod and standard
		return ((1 + modifier1) * (1 + modifier2) - 1);
	}; // getAttrModifierSum()


	var getAttrModifierDifference = function(attr, modifier1, modifier2) {
		var attribute = cache.attribute[attr];
		if (attribute.modset || !modifier2)
			return modifier1;
		if (attribute.modadd)
			return (modifier1 || 0) - modifier2;
		// modmod and standard
		return (((1 + (modifier1 || 0)) / (1 + modifier2)) - 1);
	}; // getAttrModifierDifference()


	var getModuleLabel = function(module) {
		return (
			module.class
			+ module.rating
			+ ((module.mount || module.missile || module.cabincls) ? '/' : '')
			+ (module.mount || '')
			+ (module.missile || '')
			+ (module.cabincls || '')
			+ ' '
			+ module.name
		);
	}; // getModuleLabel()


	var getModuleLabelDOM = function(module, abbrev, icons) {
		var df = document.createDocumentFragment();
		if (module.tag && icons)
			df.append(createIcon(ICON_TAG[module.tag]), ' ');
		df.append(''+module.class, createTranslatedElement('span', 'rating-'+module.rating.toLowerCase()));
		if (module.mount || module.missile || module.cabincls)
			df.appendChild(createTranslatedElement('span', 'divider'));
		if (module.mount)
			df.appendChild(icons ? createIcon(ICON_MOUNT[  module.mount  ]) : createTranslatedElement('span', 'mount-'  +module.mount.toLowerCase()  +'-abbr'));
		if (module.missile)
			df.appendChild(icons ? createIcon(ICON_MISSILE[module.missile]) : createTranslatedElement('span', 'missile-'+module.missile.toLowerCase()+'-abbr'));
		if (module.cabincls)
			df.appendChild(createTranslatedElement('span', 'cabincls-'+module.cabincls.toLowerCase()+'-abbr'));
		var key = 'module-' + (module.namekey || module.id);
		if (abbrev) {
			abbrev = ((eddb.mtype[module.mtype] || EMPTY_OBJ).modulenames || EMPTY_OBJ)[module.name];
			key = ((typeof abbrev === 'string') ? (key+'-abbr') : (abbrev ? '' : key));
		}
		if (key)
			df.append((df.firstChild ? ' ' : ''), createTranslatedElement('span', key));
		return df;
	}; // getModuleLabelDOM()


	var getModuleAttrs = function(module) {
		var attrflag = {};
		for (var attr in module) {
			if (cache.attribute[attr] && !cache.attribute[attr].hidden)
				attrflag[attr] = 1;
		}
		var mtype = eddb.mtype[module.mtype];
		if (mtype) {
			var modifiable = (mtype.modifiable || EMPTY_ARR);
			for (var a = 0;  a < modifiable.length;  a++) {
				if (cache.attribute[modifiable[a]])
					attrflag[modifiable[a]] = 1;
			}
		}
		if (attrflag.damage) {
			attrflag.dps = 1;
			if (attrflag.rldtime)
				attrflag.sdps = 1;
		}
		if (attrflag.bstrof || attrflag.bstsize || attrflag.bstint) {
			attrflag.rof = 1;
			if (attrflag.rldtime)
				attrflag.srof = 1;
		}
		var attrs = Object.keys(attrflag);
		attrs.sort(sortAttributes);
		return attrs;
	}; // getModuleAttrs()


	var getModuleAttrModificationIndex = function(module, attr) {
		var attribute = cache.attribute[attr];
		if (!module || !attribute)
			return -1;
		var modifiable = (eddb.mtype[module.mtype] || EMPTY_OBJ).modifiable;
		var value = ((attr in module) ? module[attr] : attribute.default);
		if (!modifiable || isNaN(value) || (value == 0 && !attribute.modset && !attribute.modadd && !attribute.modmod))
			return -1;
		return modifiable.indexOf(attr);
	}; // getModuleAttrModificationIndex()


	var isModuleAttrModifiable = function(module, attr) {
		return ((getModuleAttrModificationIndex(module, attr) >= 0) || ((attr === 'rof') && (getModuleAttrModificationIndex(module, 'bstint') >= 0)));
	}; // isModuleAttrModifiable()


	var getModuleAttrValue = function(module, attr, modifier) {
		if (!module)
			return undefined;
		var value = module[attr];
		switch (attr) {
		case 'fpc':
		case 'sfpc':
			value = getModuleAttrValue(module, 'ammoclip') || getModuleAttrValue(module, 'bstsize');
			break;

		case 'spc':
		case 'sspc':
			var dmgmul = getModuleAttrValue(module, 'dmgmul');
			var duration = getModuleAttrValue(module, 'duration') * (dmgmul ? WEAPON_CHARGE : 1.0);
			if (module.name === eddb.module[84224].name && attr === 'sspc') // TODO: bug? Imperial Hammer Rail Gun can keep firing through reloads without re-charging
				duration = 0;
			var bstsize = getModuleAttrValue(module, 'bstsize');
			var bstrof = getModuleAttrValue(module, 'bstrof');
			var bstint = getModuleAttrValue(module, 'bstint');
			value = (duration + (bstsize - 1) / bstrof + bstint);
			var ammoclip = getModuleAttrValue(module, 'ammoclip');
			var rldtime = (attr === 'sspc') ? getModuleAttrValue(module, 'rldtime') : 0;
			if (ammoclip) {
				value *= ceil(ammoclip / bstsize);
			}
			value += max(0, rldtime - duration - bstint);
			break;

		case 'rof':
		case 'srof':
			value = (getModuleAttrValue(module, (attr === 'srof') ? 'sfpc' : 'fpc') / getModuleAttrValue(module, (attr === 'srof') ? 'sspc' : 'spc'));
			break;

		case 'dps':
		case 'sdps':
			var damage = getModuleAttrValue(module, 'damage');
			var dmgmul = (1 + WEAPON_CHARGE * ((getModuleAttrValue(module, 'dmgmul') || 1) - 1));
			var rounds = getModuleAttrValue(module, 'rounds');
			var rof = getModuleAttrValue(module, (attr === 'sdps') ? 'srof' : 'rof');
			value = (damage * dmgmul * rounds * (isFinite(rof) ? rof : 1));
			break;

		case 'eps':
		case 'seps':
			var distdraw = getModuleAttrValue(module, 'distdraw');
			var rof = getModuleAttrValue(module, (attr === 'seps') ? 'srof' : 'rof');
			value = (distdraw * (isFinite(rof) ? rof : 1));
			break;

		case 'hps':
		case 'shps':
			var thmload = getModuleAttrValue(module, 'thmload');
			var rof = getModuleAttrValue(module, (attr === 'shps') ? 'srof' : 'rof');
			value = (thmload * (isFinite(rof) ? rof : 1));
			break;

		case 'engminmul':
		case 'engoptmul':
		case 'engmaxmul':
			var attr3 = attr.slice(3);
			var attrspd = attr3+'spd', attracc = attr3+'acc', attrrot = attr3+'rot';
			if (attrspd in module || attracc in module || attrrot in module) {
				value = (getModuleAttrValue(module, attrspd) + getModuleAttrValue(module, attracc) + getModuleAttrValue(module, attrrot)) / 3.0;
			}
			break;
		}
		var attribute = cache.attribute[attr];
		if (value === undefined && attribute && isNaN(attribute.default) && !isNaN(attribute.scale))
			value = getModuleAttrValue(module, attribute.default);
		return getAttrValue(attr, value, modifier);
	}; // getModuleAttrValue()


	var getModuleAttrValueText = function(module, attr, value) {
		var attribute = cache.attribute[attr];
		if (!module || !attribute || isNaN(value) || !isFinite(value))
			return value;
		if (attribute.step) {
			var step = attribute.step;
		} else if (attribute.modset || attribute.modadd) {
			var step = 1 / (1 << 14);
		} else if (attribute.modmod) {
			var step = abs(attribute.modmod) / (1 << 14);
		} else {
			var step = (getModuleAttrValue(module, attr) || 1) / (1 << 14);
		}
		var decimals = -ceil(log(step) / LN10 - 0.000001);
		if (decimals > 0) {
			decimals = (parseFloat(value.toFixed(decimals)).toString().split('.')[1] || '').length;
			var text = formatNumText(value, decimals);

		} else {
			var step = pow(10, -decimals);
			var text = formatNumText(((value / step + 0.5) | 0) * step, 0);
		}
		return text;
	}; // getModuleAttrValueText()


	var getModuleAttrModifier = function(module, attr, value) {
		var attribute = cache.attribute[attr];
		var base = getModuleAttrValue(module, attr);
		if (!attribute || isNaN(value) || value == base)
			return undefined;
		if (attribute.modset)
			return getModuleAttrValue(module, attr, value);
		if (attribute.modadd)
			return getModuleAttrValue(module, attr, value - base) - base;
		if (attribute.modmod) {
			value = getModuleAttrValue(module, attr, ((1 + (value / attribute.modmod)) / (1 + (base / attribute.modmod))) - 1);
			return (((1 + (value / attribute.modmod)) / (1 + (base / attribute.modmod))) - 1);
		}
		value = getModuleAttrValue(module, attr, (value / base) - 1);
		return ((value / base) - 1);
	}; // getModuleAttrModifier()


	var getModuleAttrModifierText = function(module, attr, modifier) {
		var text = '';
		var base = getModuleAttrValue(module, attr);
		var value = getModuleAttrValue(module, attr, modifier);
		if (modifier && !isNaN(base) && !isNaN(value)) {
			text = ((value > base) ? '+' : '');
			var attribute = cache.attribute[attr];
			if (attribute.modset || attribute.modadd) {
				text += formatNumText(value - base, (attribute.step >= 1) ? 0 : 2);
			} else if (attribute.modmod || attribute.unit === '%') {
				text += formatPctText((value - base) / 100.0, 1);
			} else {
				text += formatPctText(((value / base) - 1), 1);
			}
		}
		return text;
	}; // getModuleAttrModifierText()


	var getModuleAttrModifierHTML = function(module, attr, modifier) {
		return getModuleAttrModifierText(module, attr, modifier).replace('%', '<small class="semantic">%</small>');
	}; // getModuleAttrModifierHTML()


	var parseModuleAttrModifierText = function(module, attr, text) {
		var attribute = cache.attribute[attr];
		text = text.trim();
		var textvalue = parseNumText(text);
		if (!attribute || isNaN(textvalue))
			return undefined;
		var base = getModuleAttrValue(module, attr);
		if (text.slice(-1) === '%' && (attribute.unit !== '%' || text[0] === '+' || text[0] === '-')) {
			var value = base * (1 + textvalue / 100);
		} else {
			var value = base + textvalue;
		}
		return getModuleAttrModifier(module, attr, value);
	}; // parseModuleAttrModifierText()


	var getBlueprintGradeRollAttrModifier = function(bpid, bpgrade, bproll, attr) {
		var blueprint = eddb.blueprint[bpid];
		if (!blueprint)
			return null;
		var attribute = cache.attribute[attr];
		if (!attribute || !blueprint[attr])
			return null;
		bpgrade = min(max(bpgrade, 1), blueprint.maxgrade);
		bproll = min(max(bproll, 0), 1);
		var himod = blueprint[attr][bpgrade - 1];
		var lomod = ((bpgrade > 1) ? blueprint[attr][bpgrade - 2] : ((himod && blueprint[attr][1]) ? (himod - (blueprint[attr][1] - himod)) : 0));
		return (((himod < 0) === !attribute.bad) ? himod : (lomod + bproll * (himod - lomod))) / (attribute.modmod || ((attribute.modadd || attribute.modset) ? 1 : 100));
	}; // getBlueprintGradeRollAttrModifier()


	var getBlueprintGradeAttrModifierRoll = function(bpid, bpgrade, attr, modifier) {
		var blueprint = eddb.blueprint[bpid];
		if (!blueprint)
			return null;
		var attribute = cache.attribute[attr];
		if (!attribute || !blueprint[attr])
			return null;
		bpgrade = min(max(bpgrade, 1), blueprint.maxgrade);
		var himod = blueprint[attr][bpgrade - 1];
		if ((himod < 0) === !attribute.bad)
			return null;
		var lomod = ((bpgrade > 1) ? blueprint[attr][bpgrade - 2] : ((himod && blueprint[attr][1]) ? (himod - (blueprint[attr][1] - himod)) : 0));
		return ((modifier * (attribute.modmod || ((attribute.modadd || attribute.modset) ? 1 : 100))) - lomod) / (himod - lomod);
	}; // getBlueprintGradeAttrModifierRoll()


	/*
	* DATABASE CACHE INIT
	*/


	var sortObjKeyAsc = function(o1,o2) {
		return ((o1.key < o2.key) ? -1 : ((o1.key > o2.key) ? 1 : ((o1.key2 < o2.key2) ? -1 : ((o1.key2 > o2.key2) ? 1 : 0))));
	}; // sortObjKeyAsc()


	var sortObjKeyDesc = function(o1,o2) {
		return ((o1.key < o2.key) ? 1 : ((o1.key > o2.key) ? -1 : ((o1.key2 < o2.key2) ? 1 : ((o1.key2 > o2.key2) ? -1 : 0))));
	}; // sortObjKeyDesc()


	var sortNumbers = function(num1, num2) {
		return num1 - num2;
	}; // sortNumbers()


	var sortNumbersDesc = function(num1, num2) {
		return num2 - num1;
	}; // sortNumbersDesc()


	var sortStoreds = function(stored1, stored2) {
		return ((stored1.name < stored2.name) ? -1 : ((stored1.name > stored2.name) ? 1 : 0));
	}; // sortStoreds()


	var sortAttributes = function(attr1, attr2) {
		var a1 = cache.attribute[attr1];
		var a2 = cache.attribute[attr2];
		var v1 = a1._index;
		var v2 = a2._index;
		if (v1 != v2) return v1 - v2;
		v1 = a1.name;
		v2 = a2.name;
		if (v1 != v2) return (v1 < v2) ? -1 : ((v1 > v2) ? 1 : 0);
		v1 = attr1;
		v2 = attr2;
		return (v1 < v2) ? -1 : ((v1 > v2) ? 1 : 0);
	}; // sortAttributes()


	var sortMaterials = function(mat1, mat2) {
		var m1 = eddb.material[mat1];
		var m2 = eddb.material[mat2];
		if (!m1 || !m2) return (m1 ? 1 : (m2 ? -1 : 0));
		var v1 = getTranslation('material-'+mat1) || m1.name;
		var v2 = getTranslation('material-'+mat2) || m2.name;
		return (v1 < v2) ? -1 : ((v1 > v2) ? 1 : 0);
	}; // sortMaterials();


	var sortShipIDs = function(shipid1, shipid2) {
		var v1 = getTranslation('ship-'+shipid1) || eddb.ship[shipid1].name;
		var v2 = getTranslation('ship-'+shipid2) || eddb.ship[shipid2].name;
		return (v1 < v2) ? -1 : ((v1 > v2) ? 1 : 0);
	}; // sortShipIDs()


	var sortMtypes = function(mtype1, mtype2) {
		var v1 = (eddb.mtype[mtype1].sortname || getTranslation('mtype-'+mtype1) || eddb.mtype[mtype1].name);
		var v2 = (eddb.mtype[mtype2].sortname || getTranslation('mtype-'+mtype2) || eddb.mtype[mtype2].name);
		return (v1 < v2) ? -1 : ((v1 > v2) ? 1 : 0);
	}; // sortMtypes()


	var sortModules = function(m1, m2) {
		var modid1 = m1.id;
		var modid2 = m2.id;
		// by class (size)
		var v1 = 0 + (m1.class || 0);
		var v2 = 0 + (m2.class || 0);
		if (v1 != v2) return (current.option.revsize ? (v2 - v1) : (v1 - v2));
		// by uniqueness
		var a1 = eddb.mtype[m1.mtype].modulenames[m1.name];
		v1 = (a1 ? ((typeof a1 !== 'string') ? 0 : 1) : 2);
		var a2 = eddb.mtype[m2.mtype].modulenames[m2.name];
		v2 = (a2 ? ((typeof a2 !== 'string') ? 0 : 1) : 2);
		if (v1 != v2) return v1 - v2;
		// by abbreviation // TODO: sort by translated abbreviation, not hardcoded english
		if (v1 === 1 && a1 !== a2)
			return (a1 < a2) ? -1 : 1;
		// if non-unique, ...
		if (v1 < 2) {
			// by missile type (D-S)
			v1 = 0 + (m1.missile || ' ').charCodeAt(0);
			v2 = 0 + (m2.missile || ' ').charCodeAt(0);
			if (v1 != v2) return v1 - v2;
			// by passenger cabin class (E-B-F-L)
			v1 = 0 + (((m1.cabincls == 'E') ? 'A' : m1.cabincls) || ' ').charCodeAt(0);
			v2 = 0 + (((m2.cabincls == 'E') ? 'A' : m2.cabincls) || ' ').charCodeAt(0);
			if (v1 != v2) return v1 - v2;
			// by multi limpet type (M-O-R-X-U)
			v1 = 0 + (((m1.mlctype == 'U') ? 'z' : m1.mlctype) || ' ').charCodeAt(0);
			v2 = 0 + (((m2.mlctype == 'U') ? 'z' : m2.mlctype) || ' ').charCodeAt(0);
			if (v1 != v2) return v1 - v2;
		}
		// if experimental, by name
		if (m1.mtype === 'hex' || m1.mtype === 'uex') {
			v1 = getTranslation('module-'+(m1.namekey || modid1)) || m1.name;
			v2 = getTranslation('module-'+(m2.namekey || modid2)) || m2.name;
			if (v1 != v2) return ((v1 < v2) ? -1 : (v1 > v2) ? 1 : 0);
		}
		// by tag
		v1 = 0 - (m1.tag || '~').charCodeAt(0);
		v2 = 0 - (m2.tag || '~').charCodeAt(0);
		if (v1 != v2) return v1 - v2;
		// by mount type (F-G-T)
		v1 = 0 + (m1.mount || ' ').charCodeAt(0);
		v2 = 0 + (m2.mount || ' ').charCodeAt(0);
		if (v1 != v2) return v1 - v2;
		// by rating (A-B-C-D-E-F-G-H-I)
		v1 = 0 - (m1.rating || ' ').charCodeAt(0);
		v2 = 0 - (m2.rating || ' ').charCodeAt(0);
		if (v1 != v2) return (current.option.revrating ? (v2 - v1) : (v1 - v2));
		// by name
		v1 = getTranslation('module-'+(m1.namekey || modid1)) || m1.name;
		v2 = getTranslation('module-'+(m2.namekey || modid2)) || m2.name;
		if (v1 != v2) return ((v1 < v2) ? -1 : (v1 > v2) ? 1 : 0);
		// by cost
		v1 = 0 - (m1.cost || 0);
		v2 = 0 - (m2.cost || 0);
		if (v1 != v2) return v1 - v2;

		return 0;
	}; // sortModules()


	var sortModuleIDs = function(modid1, modid2) {
		return sortModules(eddb.module[modid1], eddb.module[modid2]);
	}; // sortModuleIDs()


	var sortBuiltinIDs = function(bmodid1, bmodid2) {
		var modid1 = Slot.getStoredHashModuleID(BUILTIN_STORED_MODULES[bmodid1].modulehash);
		var modid2 = Slot.getStoredHashModuleID(BUILTIN_STORED_MODULES[bmodid2].modulehash);
		var m1 = eddb.module[modid1];
		var m2 = eddb.module[modid2];
		// by allowed group
		for (var g = 0;  g < GROUPS.length;  g++) {
			var group = GROUPS[g];
			var v1 = (cache.groupMtypes[group] || EMPTY_ARR).includes(m1.mtype);
			var v2 = (cache.groupMtypes[group] || EMPTY_ARR).includes(m2.mtype);
			if (v1 && !v2)
				return -1;
			if (!v1 && v2)
				return 1;
		}
		// by mtype, module
		var v = sortMtypes(m1.mtype, m2.mtype);
		return v || sortModules(m1, m2);
	}; // sortBuiltinIDs()


	var sortBlueprints = function(bpid1, bpid2) {
		var b1 = eddb.blueprint[bpid1];
		var b2 = eddb.blueprint[bpid2];
		var v1 = b1 ? (getTranslation('blueprint-'+bpid1) || b1.name) : undefined;
		var v2 = b2 ? (getTranslation('blueprint-'+bpid2) || b2.name) : undefined;
		return (v1 < v2) ? -1 : ((v1 > v2) ? 1 : (v1 ? -1 : (v2 ? 1 : 0)));
	}; // sortBlueprints()


	var sortExpeffects = function(expid1, expid2) {
		var v1 = expid1 ? (getTranslation('expeffect-'+expid1) || (eddb.expeffect[expid1] || EMPTY_OBJ).name) : '';
		var v2 = expid2 ? (getTranslation('expeffect-'+expid2) || (eddb.expeffect[expid2] || EMPTY_OBJ).name) : '';
		return (v1 < v2) ? -1 : ((v1 > v2) ? 1 : 0);
	}; // sortExpeffects()


	var sortDiscounts = function(db1, db2) {
		return cache.discountMod[db1] - cache.discountMod[db2];
	}; // sortDiscounts()


	var getClosestDiscount = function(mod) {
		var a = cache.discounts;
		var lo = 0;
		var hi = a.length - 1;
		if (mod < cache.discountMod[a[lo]]) return a[lo];
		if (mod > cache.discountMod[a[hi]]) return a[hi];
		while ((hi - lo) > 1) {
			var md = (lo + hi) >> 1;
			var val = cache.discountMod[a[md]];
			if (val < mod) {
				lo = md;
			} else if (val > mod) {
				hi = md;
			} else {
				return a[md];
			}
		}
		return (((mod - cache.discountMod[a[lo]]) < (cache.discountMod[a[hi]] - mod)) ? a[lo] : a[hi]);
	}; // getClosestDiscount()


	var sortSlotModules = function(slot1, slot2) {
		// by emptiness
		var m1 = slot1.getModule();
		var m2 = slot2.getModule();
		var v1 = !!m1;
		var v2 = !!m2;
		if (!v1 || !v2) return (v1 ? -1 : (v2 ? 1 : 0));
		var c;
		// if same/different module ...
		if (slot1.getModuleID() == slot2.getModuleID()) {
			// by blueprint
			c = sortBlueprints(slot1.getBlueprintID(), slot2.getBlueprintID());
			if (c) return c;
			// by grade
			v1 = slot1.getBlueprintGrade();
			v2 = slot2.getBlueprintGrade();
			if (v1 != v2) return v2 - v1;
			// by roll
			v1 = slot1.getBlueprintRoll();
			v2 = slot2.getBlueprintRoll();
			if (v1 != v2) return v2 - v1;
			// by expeffect
			c = sortExpeffects(slot1.getExpeffectID(), slot2.getExpeffectID());
			if (c) return c;
			// by discount
			c = sortDiscounts(slot1.getDiscounts(), slot2.getDiscounts());
			if (c) return c;
		} else {
			// by slotgroup
			v1 = GROUPS.indexOf(slot1.getSlotGroup());
			v2 = GROUPS.indexOf(slot2.getSlotGroup());
			if (v1 != v2) return v2 - v1;
			// if not core component, ...
			if (GROUPS[v1] !== 'component') {
				// by class (size), descending
				v1 = 0 + (m1.class || 0);
				v2 = 0 + (m2.class || 0);
				if (v1 != v2) return v2 - v1;
				// by mtype
				c = sortMtypes(m1.mtype, m2.mtype);
				if (c) return c;
				// by name
				v1 = getTranslation('module-'+(m1.namekey || slot1.getModuleID())) || m1.name;
				v2 = getTranslation('module-'+(m2.namekey || slot2.getModuleID())) || m2.name;
				if (v1 != v2) return ((v1 < v2) ? -1 : (v1 > v2) ? 1 : 0);
				// by cost
				v1 = 0 - (m1.cost || 0);
				v2 = 0 - (m2.cost || 0);
				if (v1 != v2) return v1 - v2;
			}
		}
		// by slot index
		v1 = slot1.getSlotNum();
		v2 = slot2.getSlotNum();
		if (v1 != v2) return v1 - v2;

		return 0;
	}; // sortSlotModules()


	var initCache = function() {
		// initialize and tag ships
		cache.ships = Object.keys(eddb.ship);
		for (var sid in eddb.ship)
			eddb.ship[sid].id = sid;

		// tag modules
		for (var mid in eddb.module)
			eddb.module[mid].id = mid;

		// initialize and tag attributes
		for (var i = 0;  i < eddb.attributes.length;  i++) {
			var attribute = eddb.attributes[i];
			attribute._index = i;
			if (attribute.attr)
				cache.attribute[attribute.attr] = attribute;
		}

		// initialize ship-specific modules and stock ship builds and hashes
		cache.shipModules = {};
		cache.shipBuild = {};
		cache.shipHash = {};
		cache.hiddenmods = [];
		for (var shipid in eddb.ship) {
			var ship = eddb.ship[shipid];
			cache.shipModules[shipid] = {};
			for (var modid in (ship.module || EMPTY_OBJ)) {
				var module = clone(clone({}, eddb.module[modid]), ship.module[modid]);
				cache.shipModules[shipid][modid] = module;
				if (module.hidden) {
					cache.hiddenmods.push(modid);
				}
			}
			var build = new Build(shipid, true);
			cache.shipBuild[shipid] = build;
			cache.shipHash[shipid] = build.getHash();
		}

		// initialize mtypes for each group
		cache.groupMtypes = {};
		cache.mtypeModules = {};
		cache.mtypeBuiltins = {};
		for (var g = 0;  g < GROUPS.length;  g++) {
			var group = GROUPS[g];
			cache.groupMtypes[group] = [];
			if (group === 'component') {
				for (var s = 0;  s < eddb.group.component.length;  s++) {
					for (var mtype in eddb.group.component[s].mtypes) {
						// display fuel tanks under internals so they appear in the right place in both filters
						if (mtype === 'cft') continue;
						cache.groupMtypes[group].push(mtype);
						cache.mtypeModules[mtype] = [];
						cache.mtypeBuiltins[mtype] = [];
					}
				}
			} else if (group === 'military') {
				// display all military under internals
			} else {
				for (var mtype in eddb.group[group].mtypes) {
					cache.groupMtypes[group].push(mtype);
					cache.mtypeModules[mtype] = [];
					cache.mtypeBuiltins[mtype] = [];
				}
			}
		}

		// initialize stock module hashes and reserved modules, and find size gaps
		cache.moduleHash = {};
		cache.reservedmods = [];
		for (var modid in eddb.module) {
			cache.moduleHash[modid] = Slot.getModuleIDStoredHash(modid);
			var module = eddb.module[modid];
			var mtype = module.mtype;
			if (cache.mtypeModules[mtype]) {
				cache.mtypeModules[mtype].push(modid);
			}
			if (module.hidden) {
				cache.hiddenmods.push(modid);
			}
			if (module.reserved || module.mtype == 'ipvh') { // hack: by putting all PVHs in reservedmods even though only LPVHs are reserved, they'll be flagged by per-slot scanning in the case of the FighterBay slot
				cache.reservedmods.push(modid);
			}
		}
		cache.mtypeSizeGaps = {};
		for (var mtype in cache.mtypeModules) {
			var classes = {};
			for (var m = 0;  m < cache.mtypeModules[mtype].length;  m++) {
				classes[eddb.module[cache.mtypeModules[mtype][m]].class] = 1;
			}
			for (var c = 0;  c <= MAX_SLOT_CLASS;  c++) {
				for (var u = c + 1;  u <= MAX_SLOT_CLASS && classes[c] && !classes[u];  u++) {
					if (!cache.mtypeSizeGaps[mtype])
						cache.mtypeSizeGaps[mtype] = {};
					if (!cache.mtypeSizeGaps[mtype][c])
						cache.mtypeSizeGaps[mtype][c] = [];
					cache.mtypeSizeGaps[mtype][c].push(u);
				}
			}
		}

		// initialize mtype builtins, builtin modulehashes, and default builtin options
		var build = new Build(1);
		var slot = build.getDetachedSlot();
		cache.modulehashBuiltin = {};
		for (var bmodid in BUILTIN_STORED_MODULES) {
			var builtinhash = BUILTIN_STORED_MODULES[bmodid].modulehash;
			var modid = Slot.getStoredHashModuleID(builtinhash);
			var mtype = eddb.module[modid].mtype;
			if (cache.mtypeBuiltins[mtype]) {
				cache.mtypeBuiltins[mtype].push(bmodid);
			}

			// get current-version builtinhashes of all builtin stored modules, with and without preeng flags, so that lookups will work
			cache.modulehashBuiltin[builtinhash] = bmodid;
			slot.setStoredHash(builtinhash, null, true);
			slot.setPreEngineered(0);
			cache.modulehashBuiltin[slot.getBuiltinHash()] = bmodid;
			slot.setPreEngineered(slot.isModified());
			cache.modulehashBuiltin[slot.getBuiltinHash()] = bmodid;
			BUILTIN_STORED_MODULES[bmodid].modulehash = slot.getBuiltinHash();

			var opt = 'builtin' + bmodid;
			current.option[opt] = ((BUILTIN_STORED_MODULES[bmodid].tag !== 'C') ? true : false);
		}

		// initialize mtype blueprints and expeffects
		cache.mtypeBlueprints = {};
		cache.mtypeExpeffects = {};
		for (var mtype in eddb.mtype) {
			if (eddb.mtype[mtype].blueprints) {
				cache.mtypeBlueprints[mtype] = eddb.mtype[mtype].blueprints.slice(0);
			}
			if (eddb.mtype[mtype].expeffects) {
				cache.mtypeExpeffects[mtype] = eddb.mtype[mtype].expeffects.slice(0);
			}
		}

		// generate and sort discount bits
		var db = ((1 << DISCOUNTS.length) - 1);
		cache.discountMod[db] = 0;
		while (db-- > 0) {
			var mod = 1.0, m = 1, i = DISCOUNTS.length;
			while (i-- > 0) {
				mod *= (db & m) ? (1.0 - DISCOUNTS[i] / 100.0) : 1.0;
				m <<= 1;
			}
			cache.discountMod[db] = mod;
		}
		cache.discounts = Object.keys(cache.discountMod);
		cache.discounts.sort(sortDiscounts);

		// store default CSS options
		if (document.title === 'EDSY') {
			var compStyle = getComputedStyle(document.documentElement);
			for (var i = 0;  i < CSS_FONTS.length;  i++) {
				var opt = 'font' + CSS_FONTS[i];
				cache.option[opt] = compStyle.getPropertyValue('--' + opt).trim();
				current.option[opt] = '';
			}
			current.option.colorinvert = cache.option.colorinvert = false;
			for (var n = 1;  n <= 5;  n++) {
				var opt = 'colorgrey' + n;
				cache.option[opt] = compStyle.getPropertyValue('--' + opt).trim();
			}
			for (var i = 0;  i < CSS_COLORS.length;  i++) {
				for (var n = 1;  n <= 5;  n++) {
					var opt = 'color' + CSS_COLORS[i] + n;
					cache.option[opt] = compStyle.getPropertyValue('--' + opt).trim();
					current.option[opt] = '';
				}
			}

			// create DOM templates for each defined SVG icon
			var div = document.createElement('div');
			document.getElementById('svg_defs').querySelectorAll('symbol').forEach(function (sym) {
				var id = sym.id;
				if (id.startsWith('icon_')) {
					var name = id.substring(5);
					// have to use a div shim because creating the svg element directly seems to break the <use xlink:href> somehow, so it renders no icon
					div.innerHTML = '<svg class="iconsvg ' + name + '"><use xlink:href="#' + id + '"/></svg>';
					cache.icon[name] = div.removeChild(div.firstChild);
				}
			});
		}
	}; // initCache()


	var sortCache = function(onlymodules) {
		cache.ships.sort(sortShipIDs);
		if (!onlymodules) {
			for (var group in cache.groupMtypes) {
				cache.groupMtypes[group].sort(sortMtypes);
			}
		}
		for (var mtype in cache.mtypeModules) {
			cache.mtypeModules[mtype].sort(sortModuleIDs);
		}
		for (var mtype in cache.mtypeBuiltins) {
			cache.mtypeBuiltins[mtype].sort(sortBuiltinIDs);
		}
		if (!onlymodules) {
			for (var mtype in cache.mtypeBlueprints) {
				cache.mtypeBlueprints[mtype].sort(sortBlueprints);
			}
			for (var mtype in cache.mtypeExpeffects[mtype]) {
				cache.mtypeExpeffects[mtype].sort(sortExpeffects);
			}
		}
	}; // sortCache()


	/*
	* PAGE & POPUP UI
	*/


	var setUIPageTab = function(tab) {
		current.page = tab;
		document.forms.header.elements.tab.value = tab;
		document.getElementById('page_body').className = tab;
		if (tab === 'outfitting')
			updateUIStatsPanels();
	}; // setUIPageTab()


	var showUIPopup = function(element, trigger, refocus, sticky, onOkay, onCancel) {
		if (trigger && current.popup.trigger === trigger) {
			return hideUIPopup();
		} else if (current.popup.element) {
			current.popup.element.style.display = 'none';
		} else {
			document.addEventListener('click', onDocumentClickFocus, true);
			document.addEventListener('focus', onDocumentClickFocus, true);
		}
		updateTranslations(element);
		element.style.display = 'block';
		current.popup.element = element;
		current.popup.trigger = trigger;
		current.popup.refocus = refocus;
		current.popup.sticky = sticky;
		current.popup.onOkay = onOkay;
		current.popup.onCancel = onCancel;
		return true;
	}; // showUIPopup()


	var showUITextPopup = function(html, text, trigger, sticky, onOkay, onCancel) {
		var popup = document.getElementById('popup_modal');
		var labelarea = document.getElementById('popup_desc');
		var textarea = document.forms.popup.elements.textbox;
		var table = document.getElementById('popup_table');
		var status = document.getElementById('popup_status');
		var okay = document.forms.popup.elements.okay;
		var cancel = document.forms.popup.elements.cancel;
		if (typeof html === 'string') {
			labelarea.innerHTML = html;
		} else {
			labelarea.replaceChildren(html);
		}
		textarea.removeAttribute('style');
		table.style.display = 'none';
		status.innerHTML = '';
		okay.style.display = (onOkay ? '' : 'none');
		cancel.style.display = (onCancel ? '' : 'none');
		if (text) {
			var lines = text.split('\n');
			var height = lines.length;
			var width = 0;
			while (lines.length > 0)
				width = max(width, lines.pop().length);
			textarea.cols = min(width + 5, 100);
			textarea.rows = min(height + 1, 30);
			textarea.value = text;
			textarea.style.display = '';
		} else {
			textarea.value = '';
			textarea.style.display = 'none';
		}
		var refocus = (text ? textarea : (sticky ? ((onOkay && okay) || (onCancel && cancel)) : null));
		if (!showUIPopup(popup, trigger, refocus, sticky, onOkay, onCancel))
			return false;
		if (text) {
			textarea.focus();
			textarea.select();
		} else if (onOkay) {
			okay.focus();
		} else if (onCancel) {
			cancel.focus();
		}
		return true;
	}; // showUITextPopup()


	var showUITablePopup = function(html, trigger, sticky, onOkay, onCancel) {
		var popup = document.getElementById('popup_modal');
		var labelarea = document.getElementById('popup_desc');
		var textarea = document.forms.popup.elements.textbox;
		var table = document.getElementById('popup_table');
		var status = document.getElementById('popup_status');
		var okay = document.forms.popup.elements.okay;
		var cancel = document.forms.popup.elements.cancel;
		if (typeof html === 'string') {
			labelarea.innerHTML = html;
		} else if (html) {
			labelarea.replaceChildren(html);
		} else {
			labelarea.replaceChildren();
		}
		textarea.style.display = 'none';
		table.style.display = '';
		status.innerHTML = '';
		okay.style.display = (onOkay ? '' : 'none');
		cancel.style.display = (onCancel ? '' : 'none');
		var refocus = (sticky ? ((onOkay && okay) || (onCancel && cancel)) : null);
		if (!showUIPopup(popup, trigger, refocus, sticky, onOkay, onCancel))
			return false;
		if (onOkay) {
			okay.focus();
		} else if (onCancel) {
			cancel.focus();
		}
		return table;
	}; // showUITablePopup()


	var hideUIPopup = function() {
		if (!current.popup.element)
			return false;
		document.removeEventListener('click', onDocumentClickFocus, true);
		document.removeEventListener('focus', onDocumentClickFocus, true);
		current.popup.element.style.display = 'none';
		current.popup.element = null;
		current.popup.trigger = null;
		current.popup.refocus = null;
		current.popup.sticky = null;
		current.popup.onOkay = null;
		current.popup.onCancel = null;
		return true;
	}; // hideUIPopup()


	/*
	* SHIPYARD UI
	*/


	var formatShipyardSlots = function(build, slotgroup, asSize) {
		var sizes = eddb.ship[build.getShipID()].slots[slotgroup].slice(0);
		sizes.sort(sortNumbersDesc);
		if (!asSize)
			return sizes.join(' ');
		var df = document.createDocumentFragment();
		for (var i = 0;  i < sizes.length;  i++)
			df.append((i ? ' ' : ''), createTranslatedElement('span', 'size-'+sizes[i]+'-abbr'));
		return df;
	}; // formatShipyardSlots()


	var UI_SHIPYARD_COL = {
		label           : { header:'ui-shipyard-build-label',         abbr:'ui-shipyard-build-desc',                                               css:'text',                     nochange:1,              render:function(build) { return build.getName(); } },
		name_ship       : { header:'ui-shipyard-ship-label',          abbr:'ui-shipyard-ship-desc',                                                css:'text',                     nochange:1,              shipattr:'name' },
		cost            : { header:'ui-shipyard-cost-label',                                                                                       css:'tar', sortnum:true,        attr:'cost',    scale:0, buildstat:'cost' },
		szcls           : { header:'ui-shipyard-size-label',          abbr:'ui-shipyard-size-desc',                                                css:'tac', sortnum:true,                                 shipattr:'class', render:function(build) { return createTranslatedElement('span', 'size-'+((eddb.ship[build.getShipID()] || EMPTY_OBJ).class || 0)+'-abbr'); } },
		crew            : { header:'ui-shipyard-crew-label',                                                                                       css:'tar', sortnum:true,        attr:'crew',             shipattr:'crew' },
		masslock        : { header:'ui-shipyard-masslock-label',                                                                                   css:'tar', sortnum:true,        attr:'masslock',         shipattr:'masslock' },
		mass_hull       : { header:'ui-shipyard-mass-hull-label',     abbr:'ui-shipyard-mass-hull-desc',     colgroup:'ui-shipyard-mass-label',    css:'tar', sortnum:true,        attr:'mass',    scale:0, buildstat:'mass_hull' },
		mass_unl        : { header:'ui-shipyard-mass-unladen-label',  abbr:'ui-shipyard-mass-unladen-desc',  colgroup:'ui-shipyard-mass-label',    css:'tar', sortnum:true,        attr:'mass',    scale:0, buildstat:'mass_unladen' },
		mass_ldn        : { header:'ui-shipyard-mass-laden-label',    abbr:'ui-shipyard-mass-laden-desc',    colgroup:'ui-shipyard-mass-label',    css:'tar', sortnum:true,        attr:'mass',    scale:0, buildstat:'mass_laden' },
		jump_unl        : { header:'ui-shipyard-jump-unladen-label',  abbr:'ui-shipyard-jump-unladen-desc',  colgroup:'ui-shipyard-jump-label',    css:'tar', sortnum:true,                        scale:1, buildstat:'_jump_unladen' },
		jump_ldn        : { header:'ui-shipyard-jump-laden-label',    abbr:'ui-shipyard-jump-laden-desc',    colgroup:'ui-shipyard-jump-label',    css:'tar', sortnum:true,                        scale:1, buildstat:'_jump_laden' },
		range_unl       : { header:'ui-shipyard-range-unladen-label', abbr:'ui-shipyard-range-unladen-desc', colgroup:'ui-shipyard-range-label',   css:'tar', sortnum:true,                        scale:1, buildstat:'_range_unladen' },
		range_ldn       : { header:'ui-shipyard-range-laden-label',   abbr:'ui-shipyard-range-laden-desc',   colgroup:'ui-shipyard-range-label',   css:'tar', sortnum:true,                        scale:1, buildstat:'_range_laden' },
		topspd          : { header:'ui-shipyard-speed-label',         abbr:'ui-shipyard-speed-desc',         colgroup:' ',                         css:'tar', sortnum:true,        attr:'topspd',           buildstat:'_speed' },
		bstspd          : { header:'ui-shipyard-boost-label',         abbr:'ui-shipyard-boost-desc',         colgroup:' ',                         css:'tar', sortnum:true,        attr:'bstspd',           buildstat:'_boost' },
		shields         : { header:'ui-shipyard-shield-label',        abbr:'ui-shipyard-shield-desc',        colgroup:'  ',                        css:'tar', sortnum:true,        attr:'shields',          buildstat:'_shields' },
		armour          : { header:'ui-shipyard-armour-label',        abbr:'ui-shipyard-armour-desc',        colgroup:'  ',                        css:'tar', sortnum:true,        attr:'armour',           buildstat:'_armour' },
		hardness        : { header:'ui-shipyard-hardness-label',                                             colgroup:'  ',                        css:'tar', sortnum:true,        attr:'hardness',         shipattr:'hardness' },
		fuelcap         : { header:'ui-shipyard-fuel-label',                                                 colgroup:' ',                         css:'tar', sortnum:true,        attr:'fuelcap', scale:0, buildstat:'fuelcap' },
		cargocap        : { header:'ui-shipyard-cargo-label',                                                colgroup:' ',                         css:'tar', sortnum:true,        attr:'cargocap',         buildstat:'cargocap' },
		cabincap        : { header:'ui-shipyard-passenger-label',                                            colgroup:' ',                         css:'tar', sortnum:true,        attr:'cabincap',         buildstat:'cabincap' },
		slots_hardpoint : { header:'ui-shipyard-hardpoint-label',     abbr:'ui-shipyard-hardpoint-desc',     colgroup:'ui-shipyard-slots-label',   css:'tal', sortalt:true,                                 render:function(build) { return formatShipyardSlots(build, 'hardpoint', true); }, sortkey:function(build) { return formatShipyardSlots(build, 'hardpoint');} },
		slots_utility   : { header:'ui-shipyard-utility-label',       abbr:'ui-shipyard-utility-desc',       colgroup:'ui-shipyard-slots-label ',  css:'tac', sortnum:true,                                 render:function(build) { return eddb.ship[build.getShipID()].slots.utility.length; } },
		slots_core_0    : { header:'ui-shipyard-core-bh-label',       abbr:'ui-shipyard-core-bh-desc',       colgroup:'ui-shipyard-slots-label',   css:'tac', sortnum:true,                                 render:function(build) { return eddb.ship[build.getShipID()].slots.component[0]; } },
		slots_core_1    : { header:'ui-shipyard-core-pp-label',       abbr:'ui-shipyard-core-pp-desc',       colgroup:'ui-shipyard-slots-label',   css:'tac', sortnum:true,                                 render:function(build) { return eddb.ship[build.getShipID()].slots.component[1]; } },
		slots_core_2    : { header:'ui-shipyard-core-th-label',       abbr:'ui-shipyard-core-th-desc',       colgroup:'ui-shipyard-slots-label',   css:'tac', sortnum:true,                                 render:function(build) { return eddb.ship[build.getShipID()].slots.component[2]; } },
		slots_core_3    : { header:'ui-shipyard-core-fd-label',       abbr:'ui-shipyard-core-fd-desc',       colgroup:'ui-shipyard-slots-label',   css:'tac', sortnum:true,                                 render:function(build) { return eddb.ship[build.getShipID()].slots.component[3]; } },
		slots_core_4    : { header:'ui-shipyard-core-ls-label',       abbr:'ui-shipyard-core-ls-desc',       colgroup:'ui-shipyard-slots-label',   css:'tac', sortnum:true,                                 render:function(build) { return eddb.ship[build.getShipID()].slots.component[4]; } },
		slots_core_5    : { header:'ui-shipyard-core-pd-label',       abbr:'ui-shipyard-core-pd-desc',       colgroup:'ui-shipyard-slots-label',   css:'tac', sortnum:true,                                 render:function(build) { return eddb.ship[build.getShipID()].slots.component[5]; } },
		slots_core_6    : { header:'ui-shipyard-core-ss-label',       abbr:'ui-shipyard-core-ss-desc',       colgroup:'ui-shipyard-slots-label',   css:'tac', sortnum:true,                                 render:function(build) { return eddb.ship[build.getShipID()].slots.component[6]; } },
		slots_core_7    : { header:'ui-shipyard-core-ft-label',       abbr:'ui-shipyard-core-ft-desc',       colgroup:'ui-shipyard-slots-label',   css:'tac', sortnum:true,                                 render:function(build) { return eddb.ship[build.getShipID()].slots.component[7]; } },
		slots_military  : { header:'ui-shipyard-military-label',      abbr:'ui-shipyard-military-desc',      colgroup:'ui-shipyard-slots-label ',  css:'tal', sortalt:true,                                 render:function(build) { return formatShipyardSlots(build, 'military');} },
		slots_internal  : { header:'ui-shipyard-internal-label',      abbr:'ui-shipyard-internal-desc',      colgroup:'ui-shipyard-slots-label',   css:'tal', sortalt:true,                                 render:function(build) { return formatShipyardSlots(build, 'internal');} },
		dps             : { header:'ui-shipyard-dps-label',           abbr:'ui-shipyard-dps-desc',           colgroup:'ui-shipyard-weapons-label', css:'tar', sortnum:true,        attr:'dps',     scale:1, buildstat:'dps' },
		dps_abs         : { header:'ui-shipyard-dps-absolute-label',  abbr:'ui-shipyard-dps-absolute-desc',  colgroup:'ui-shipyard-weapons-label', css:'tar', sortnum:true,                                 render:function(build) { var dps = build.getStat('dps'); return (dps ? formatPctHTML(build.getStat('dps_abs') / dps, 0) : ''); }, sortkey:function(build) { return (build.getStat('dps_abs') || 0) / (build.getStat('dps') || 0.000001); } },
		dps_kin         : { header:'ui-shipyard-dps-kinetic-label',   abbr:'ui-shipyard-dps-kinetic-desc',   colgroup:'ui-shipyard-weapons-label', css:'tar', sortnum:true,                                 render:function(build) { var dps = build.getStat('dps'); return (dps ? formatPctHTML(build.getStat('dps_kin') / dps, 0) : ''); }, sortkey:function(build) { return (build.getStat('dps_kin') || 0) / (build.getStat('dps') || 0.000001); } },
		dps_thm         : { header:'ui-shipyard-dps-thermal-label',   abbr:'ui-shipyard-dps-thermal-desc',   colgroup:'ui-shipyard-weapons-label', css:'tar', sortnum:true,                                 render:function(build) { var dps = build.getStat('dps'); return (dps ? formatPctHTML(build.getStat('dps_thm') / dps, 0) : ''); }, sortkey:function(build) { return (build.getStat('dps_thm') || 0) / (build.getStat('dps') || 0.000001); } },
		dps_exp         : { header:'ui-shipyard-dps-explosive-label', abbr:'ui-shipyard-dps-explosive-desc', colgroup:'ui-shipyard-weapons-label', css:'tar', sortnum:true,                                 render:function(build) { var dps = build.getStat('dps'); return (dps ? formatPctHTML(build.getStat('dps_exp') / dps, 0) : ''); }, sortkey:function(build) { return (build.getStat('dps_exp') || 0) / (build.getStat('dps') || 0.000001); } },
		dps_axe         : { header:'ui-shipyard-dps-antixeno-label',  abbr:'ui-shipyard-dps-antixeno-desc',  colgroup:'ui-shipyard-weapons-label', css:'tar', sortnum:true,                                 render:function(build) { var dps = build.getStat('dps'); return (dps ? formatPctHTML(build.getStat('dps_axe') / dps, 0) : ''); }, sortkey:function(build) { return (build.getStat('dps_axe') || 0) / (build.getStat('dps') || 0.000001); } },
		dps_cau         : { header:'ui-shipyard-dps-caustic-label',   abbr:'ui-shipyard-dps-caustic-desc',   colgroup:'ui-shipyard-weapons-label', css:'tar', sortnum:true,                                 render:function(build) { var dps = build.getStat('dps'); return (dps ? formatPctHTML(build.getStat('dps_cau') / dps, 0) : ''); }, sortkey:function(build) { return (build.getStat('dps_cau') || 0) / (build.getStat('dps') || 0.000001); } },
	}; // UI_SHIPYARD_COL{}

	var UI_SHIPYARD_SHIPS_COLS = [
		'name_ship','cost','szcls','crew','masslock',
		'mass_unl','jump_unl',
		'topspd','bstspd','shields','armour','hardness','fuelcap','cargocap','cabincap',
		'slots_hardpoint','slots_utility',
		'slots_core_1','slots_core_2','slots_core_3','slots_core_4','slots_core_5','slots_core_6','slots_core_7',
		'slots_military','slots_internal',
	]; // UI_SHIPYARD_SHIPS_COLS[]

	var UI_SHIPYARD_STOREDBUILD_COLS = [
		'label','_BUTTONS_','name_ship','cost',
		'mass_unl','mass_ldn','jump_unl','jump_ldn','range_unl','range_ldn',
		'topspd','bstspd','shields','armour','fuelcap','cargocap','cabincap',
		'dps','dps_abs','dps_kin','dps_thm','dps_exp','dps_axe'
	]; // UI_SHIPYARD_STOREDBUILD_COLS[]


	var initUIShipyardShips = function() {
		var table = document.createElement('table');
		table.id = 'shipyard_ships_table';
		table.className = 'striped';
		var thead = createUIShipyardHeader(UI_SHIPYARD_SHIPS_COLS, 'ships');
		table.appendChild(thead);
		var tbody = document.createElement('tbody');
		for (var s = 0;  s < cache.ships.length;  s++) {
			var shipid = cache.ships[s];
			var tr = createUIShipyardRow(UI_SHIPYARD_SHIPS_COLS);
			tr.id = 'shipyard_ship_' + shipid;
			var a = createTranslatedElement('a', 'ship-'+shipid);
			a.href = '#/L=' + cache.shipBuild[shipid].getHash();
			a.className = 'label';
			tr.cells[0].appendChild(a);
			updateUIShipyardRow(UI_SHIPYARD_SHIPS_COLS, tr, cache.shipBuild[shipid]);
			tbody.appendChild(tr);
		}
		table.appendChild(tbody);
		document.getElementById('shipyard_ships_container').appendChild(table);
	}; // initUIShipyardShips()


	var initUIShipyardStoredBuilds = function() {
		var container = document.getElementById('shipyard_storedbuilds_container');
		var table = document.createElement('table');
		table.id = 'shipyard_storedbuilds_table';
		table.className = 'striped';
		var thead = createUIShipyardHeader(UI_SHIPYARD_STOREDBUILD_COLS, 'stored');
		table.appendChild(thead);
		var tbody = document.createElement('tbody');
		tbody.id = 'shipyard_storedbuilds_tbody';
		table.appendChild(tbody);
		container.appendChild(table);
		if (current.beta) {
			var div = document.createElement('div');
			var button = createTranslatedElement('button', 'ui-shipyard-copy-live');
			button.style.margin = '0.5em';
			button.style.padding = '0.125em 0.25em';
			button.addEventListener('click', onUIShipyardStoredCopyLiveClick);
			div.appendChild(button);
			container.appendChild(div);
		}
	}; // initUIShipyardStoredBuilds()


	var createUIShipyardHeader = function(columns, tab) {
		var thead = document.createElement('thead');

		var tr = document.createElement('tr');
		tr.className = 'colgroup';
		var colgroup = '';
		var colspan = 0;
		for (var c = 0;  c <= columns.length;  c++) {
			var col = (UI_SHIPYARD_COL[columns[c]] || EMPTY_OBJ);
			if (!columns[c] || (col.colgroup || '').trim() != colgroup) {
				if (colspan > 0) {
					var th = document.createElement('th');
					th.colSpan = colspan;
					th.className = (colgroup ? 'colgroup' : '');
					var span = createTranslatedElement('span', colgroup);
					th.appendChild(span);
					tr.appendChild(th);
				}
				colgroup = (col.colgroup || '').trim();
				colspan = 0;
			}
			colspan++;
		}
		thead.appendChild(tr);

		var tr = document.createElement('tr');
		var colgroup = '';
		for (var c = 0;  c < columns.length;  c++) {
			var col = (UI_SHIPYARD_COL[columns[c]] || EMPTY_OBJ);
			var th = document.createElement('th');
			th.className = ((col.colgroup ? 'colgroup ': '') + ((col.colgroup != colgroup) ? 'first ' : '') + (col.css || '') + (c ? ' stickytop' : ' stickytopleft'));
			colgroup = col.colgroup;
			if (col.header) {
				var span = document.createElement('span');
				var abbr = createTranslatedElement('abbr', col.header);
				var key = col.abbr || (col.attr ? ("attr-" + col.attr + "-desc") : null);
				if (key) {
					abbr.setAttribute("edsy-title", key);
					abbr.title = getTranslation(key);
				}
				span.appendChild(abbr);
				var label = document.createElement('label');
				label.className = 'togglebutton';
				var input = document.createElement('input');
				input.type = 'radio';
				input.name = 'shipyard_' + tab + '_col';
				input.value = c;
				label.appendChild(input);
				var div = document.createElement('div');
				div.appendChild(span);
				label.appendChild(div);
				th.appendChild(label);
			}
			tr.appendChild(th);
		}
		thead.appendChild(tr);

		return thead;
	}; // createUIShipyardHeader()


	var createUIShipyardRow = function(columns) {
		var tr = document.createElement('tr');
		var colgroup = '';
		for (var c = 0;  c < columns.length;  c++) {
			var col = (UI_SHIPYARD_COL[columns[c]] || EMPTY_OBJ);
			var td = document.createElement('td');
			td.className = ((col.colgroup ? 'colgroup ': '') + ((col.colgroup != colgroup) ? 'first ' : '') + (col.css || '') + (c ? '' : ' stickyleft'));
			colgroup = col.colgroup;
			tr.appendChild(td);
		}
		return tr;
	}; // createUIShipyardRow()


	var updateUIShipyardRow = function(columns, tr, build) {
		var shipslot = (build ? build.getSlot('ship', 'hull') : null);
		var value, render, sort;
		for (var c = 0;  c < columns.length;  c++) {
			var col = UI_SHIPYARD_COL[columns[c]];
			if (col && !col.nochange) {
				value = undefined;
				render = sort = '';
				if (col.shipattr && shipslot) {
					value = shipslot.getEffectiveAttrValue(col.shipattr);
				}
				if (col.buildstat) {
					value = build.getStat(col.buildstat);
				}
				if (value !== undefined) {
					render = formatAttrHTML(col.attr, value, col.scale);
					sort = value.toFixed(col.scale || 0);
				}
				if (col.render) {
					render = col.render(build);
					if (typeof render === 'string') {
						sort = ''+render;
					} else if (typeof render === 'number') {
						sort = ''+render;
						render = formatNumHTML(render, col.scale || 0);
					}
				}
				if (col.sortkey) {
					sort = col.sortkey(build);
				}

				if (typeof render === 'string') {
					tr.cells[c].innerHTML = ''+render;
				} else {
					tr.cells[c].replaceChildren(render);
				}
				tr.cells[c].setAttribute('edsy-sort', sort || '');
			}
		}
		return true;
	}; // updateUIShipyardRow()


	var updateUIShipyardStoredBuilds = function() {
		var tbody = document.getElementById('shipyard_storedbuilds_tbody');

		// remove all that were deleted
		var r = tbody.rows.length;
		while (r-- > 0) {
			var namehash = tbody.rows[r].id.split('.')[1];
			if (namehash && !current.stored.shipNamehashStored[0][namehash])
				tbody.removeChild(tbody.rows[r]);
		}

		// add or update all that currently exist
		var storeds = current.stored.shipStoreds[0];
		for (var i = 0;  i < storeds.length;  i++) {
			updateUIShipyardStoredBuild(storeds[i].namehash, null, true);
		}
		sortUIShipyardTable(document.getElementById('shipyard_storedbuilds_table'), UI_SHIPYARD_STOREDBUILD_COLS);

		return true;
	}; // updateUIShipyardStoredBuilds()


	var updateUIShipyardStoredBuild = function(namehash, build, sorted) {
		if (!namehash)
			return false;
		var stored = current.stored.shipNamehashStored[0][namehash];
		var tbody = document.getElementById('shipyard_storedbuilds_tbody');
		var tr = document.getElementById('shipyard_storedbuild.' + namehash);
		if (stored) {
			if (!build)
				build = Build.fromHash(stored.buildhash);
			if (!tr) {
				tr = createUIShipyardRow(UI_SHIPYARD_STOREDBUILD_COLS);
				tr.id = 'shipyard_storedbuild.' + namehash;
				var a = document.createElement('a');
				a.href = '#/L=' + build.getHash();
				a.className = 'label';
				a.setAttribute('edsy-namehash', namehash);
				a.title = stored.name;
				a.innerHTML = encodeHTML(stored.name);
				tr.cells[0].appendChild(a);
				var button = document.createElement('button');
				button.name = 'storedbuild_rename';
				button.value = namehash;
				button.appendChild(createIcon('rename'));
				tr.cells[1].appendChild(button);
				var button = document.createElement('button');
				button.name = 'storedbuild_delete';
				button.value = namehash;
				button.appendChild(createIcon('delete'));
				tr.cells[1].appendChild(button);
				tr.cells[2].appendChild(createTranslatedElement('span', 'ship-'+build.getShipID()));
				tbody.appendChild(tr);
			} else if (sorted) {
				tbody.appendChild(tr);
			}
			updateUIShipyardRow(UI_SHIPYARD_STOREDBUILD_COLS, tr, build);
		} else {
			if (tr)
				tr.parentNode.removeChild(tr);
		}
		if (!sorted) {
			sortUIShipyardTable(document.getElementById('shipyard_storedbuilds_table'), UI_SHIPYARD_STOREDBUILD_COLS);
		}
		return true;
	}; // updateUIShipyardStoredBuild()


	var sortUIShipyardTable = function(table, columns, col) {
		if (!table || !columns)
			return null;

		// identify sort column, direction, and mode
		var desc, alt;
		var state = (current.tableSort[table.id] || {});
		if (col === undefined) {
			col = min(max(state.col || 0, 0), columns.length - 1);
			desc = !!state.desc;
			alt = !!state.alt;
		} else {
			col = min(max(col, 0), columns.length - 1);
			if (col != state.col) {
				desc = false;
				alt = false;
			} else if (!state.desc) {
				desc = true;
				alt = state.alt;
			} else {
				desc = false;
				if (!state.alt && (UI_SHIPYARD_COL[columns[col]] || EMPTY_OBJ).sortalt) {
					alt = true;
				} else {
					alt = false;
				}
			}
			state.col = col;
			state.desc = desc = !!desc;
			state.alt = alt = !!alt;
		}

		// sort rows
		var sortnum = (UI_SHIPYARD_COL[columns[col]] || EMPTY_OBJ).sortnum;
		var sortalt = (UI_SHIPYARD_COL[columns[col]] || EMPTY_OBJ).sortalt;
		var list = [];
		var tbody = table.tBodies[0];
		for (var r = 0;  r < tbody.rows.length;  r++) {
			var row = tbody.rows[r];
			var key = (row.cells[col].getAttribute('edsy-sort') || row.cells[col].innerText);
			if (sortnum) {
				key = parseNumText(key);
				// since NaN is neither > nor < than a number, it breaks the sort; leave such rows out of the sort entirely, they'll end up at the top of the table at the end
				if (isNaN(key))
					continue;
			}
			var key2 = sortalt ? key.length : 0;
			list.push({ row:row, key:(alt ? key2 : key), key2:(alt ? key : key2) });
		}
		list.sort(desc ? sortObjKeyDesc : sortObjKeyAsc);
		for (var r = 0;  r < list.length;  r++) {
			tbody.appendChild(list[r].row);
		}

		return state;
	}; // sortUIShipyardTable()


	var setUIShipyardTab = function(tab) {
		current.shipyard_tab = tab;
		document.forms.shipyard.elements.tab.value = tab;
		document.forms.shipyard.className = tab;
	}; // setUIShipyardTab()


	var onUIShipyardTabChange = function(e) {
		if (e.target.name === 'tab' && e.target.checked) {
			setUIShipyardTab(e.target.value);
		}
	}; // onUIShipyardTabChange()


	var onUIShipyardShipsClick = function(e) {
		var el = e.target;
		while (el && el.tagName !== 'A' && el.tagName !== 'BUTTON' && el.tagName !== 'INPUT') {
			el = el.parentNode;
		}
		if (!el || el.disabled) {
		} else if (el.tagName === 'A') {
			e.stopPropagation();
			e.preventDefault();
			var tokens = (el.getAttribute('edsy-text') || '').split('-');
			if (tokens[0] === 'ship') {
				setCurrentFit(new Build(parseInt(tokens[1]), true), '');
				setUIPageTab('outfitting');
			}
		} else if (el.tagName === 'BUTTON') {
			e.stopPropagation();
			e.preventDefault();
			var tokens = el.name.split('_');
			if (tokens[1] === 'ship') {
				setCurrentFit(new Build(el.value, true), '');
				setUIPageTab('outfitting');
			}
		} else {
			var table = el;
			while (table && table.tagName !== 'TABLE')
				table = table.parentNode;
			var state = sortUIShipyardTable(table, UI_SHIPYARD_SHIPS_COLS, parseInt(el.value));
			if (state) {
				el.classList.toggle('asc', !state.desc);
				el.classList.toggle('desc', !!state.desc);
				el.classList.toggle('key1', !state.alt);
				el.classList.toggle('key2', !!state.alt);
			}
		}
	}; // onUIShipyardShipsClick()


	var onUIShipyardStoredBuildsClick = function(e) {
		var el = e.target;
		while (el && el.tagName !== 'A' && el.tagName !== 'BUTTON' && el.tagName !== 'INPUT') {
			el = el.parentNode;
		}
		if (!el || el.disabled) {
		} else if (el.tagName === 'A') {
			e.stopPropagation();
			e.preventDefault();
			var namehash = el.getAttribute('edsy-namehash');
			if (namehash) {
				setCurrentFitNameHash(namehash);
				setUIPageTab('outfitting');
			}
		} else if (el.tagName === 'BUTTON') {
			e.stopPropagation();
			e.preventDefault();
			var tokens = el.name.split('_');
			switch (tokens[1]) {
			case 'reload':
				setCurrentFitNameHash(el.value);
				setUIPageTab('outfitting');
				break;

			case 'rename':
				renameStoredBuild(el.value);
				break;

			case 'delete':
				deleteStoredBuild(el.value);
				break;
			}
		} else {
			var table = el;
			while (table && table.tagName !== 'TABLE')
				table = table.parentNode;
			var state = sortUIShipyardTable(table, UI_SHIPYARD_STOREDBUILD_COLS, parseInt(el.value));
			if (state) {
				el.classList.toggle('asc', !state.desc);
				el.classList.toggle('desc', !!state.desc);
				el.classList.toggle('key1', !state.alt);
				el.classList.toggle('key2', !!state.alt);
			}
		}
	}; // onUIShipyardStoredBuildsClick()


	var onUIShipyardStoredCopyLiveClick = function(e) {
		e.stopPropagation();
		e.preventDefault();
		if (current.beta && confirm(getTranslation('ui-shipyard-copy-live-confirm'))) {
			readStoredBuilds(true);
			updateUIShipyardStoredBuilds();
			updateUIFitStoredBuilds();
			writeStoredBuilds();
		}
	}; // onUIShipyardStoredCopyLiveClick()


	/*
	* OUTFITTING UI
	*/


	var updateUIFullscreen = function() {
		var doc = window.document;
		var supported = (cache.feature.requestFullscreen && cache.feature.cancelFullscreen);
		var active = (doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement);
		document.getElementById('window_maximize').style.display = ((active || !supported) ? 'none' : 'inline-block');
		document.getElementById('window_minimize').style.display = ((active &&  supported) ? 'inline-block' : 'none');
	}; // updateUIFullscreen()


	var updateUILayout = function() {
		var divBody = document.getElementById('outfitting_fit_body');
		var colWidth = max(document.getElementById('slots_column_left').offsetWidth, document.getElementById('slots_column_right').offsetWidth);
		var nameWidth = min(document.getElementById('outfitting_fit_module_ship_hull').offsetWidth, document.getElementById('outfitting_fit_module_ship_hatch').offsetWidth);
		var onecol = (current.outfitting_onecol ? (colWidth - nameWidth + 120 > 0.5 * divBody.clientWidth) : (divBody.scrollWidth > divBody.clientWidth));
		if (current.outfitting_onecol != onecol) {
			current.outfitting_onecol = onecol;
			var tableLeft = document.getElementById('slots_table_left');
			var tableRight = document.getElementById('slots_table_right');
			var tr = document.getElementById('outfitting_fit_slot_ship_hatch');
			(onecol ? tableLeft : tableRight).tBodies[0].appendChild(tr);
			for (var g = 0;  g < GROUPS.length;  g++) {
				var slotgroup = GROUPS[g];
				var tbody = document.getElementById('outfitting_fit_' + slotgroup);
				((onecol || slotgroup === 'hardpoint' || slotgroup === 'component') ? tableLeft : tableRight).appendChild(tbody);
			}
			document.getElementById('slots_column_right').style.display = (onecol ? 'none' : '');
		}
		return true;
	}; // updateUILayout()


	var getUIOutfittingSlot = function() {
		switch (current.outfitting_focus) {
		case 'module':  return current.pickerSlot;
		case 'slot':    return current.fit.getSlot(current.group, current.slot);
		}
		return null;
	}; // getUIOutfittingSlot()


	var setUIOutfittingFocus = function(focus) {
		if (focus !== 'module' && focus !== 'slot')
			return false;
		current.outfitting_focus = focus;
		document.getElementById('page_body_outfitting').className = 'focus' + focus;
		var el = document.getElementById('outfitting_details_button_replace');
		var mode = (focus === 'module') ? 'Install' : 'Replace';
		el.setAttribute('edsy-text', 'ui-button-'+mode.toLowerCase());
		el.innerText = mode;
		return true;
	}; // setUIOutfittingFocus()


	var setUIOutfittingPanels = function(show1, show2a, show2b) {
		if (show1) {
			current.outfitting_show1 = show1;
		}
		if (show2a) {
			if (show2b) {
				current.outfitting_show2b = show2b;
				current.outfitting_show2a = show2a;
			} else {
				if (current.outfitting_show2a !== show2a)
					current.outfitting_show2b = current.outfitting_show2a;
				current.outfitting_show2a = show2a;
			}
		}
		document.getElementById('outfitting_top').className = (
			'show1' + current.outfitting_show1 +
			' show2' + current.outfitting_show2a +
			' show2' + current.outfitting_show2b
		);
		return true;
	}; // setUIOutfittingPanels()


	var setCurrentDrag = function(modid, namehash, fromgroup, fromslot) {
		current.drag = (isNaN(modid) ? null : { id:modid, namehash:namehash, group:fromgroup, slot:fromslot });
		if (!isNaN(modid) && fromgroup) {
			document.getElementById('outfitting_modules_container').addEventListener('dragenter', onUIModulePickerDragEnter);
			document.getElementById('outfitting_modules_container').addEventListener('dragover', onUIModulePickerDragOver);
			document.getElementById('outfitting_modules_container').addEventListener('dragleave', onUIModulePickerDragLeave);
		} else {
			document.getElementById('outfitting_modules_container').removeEventListener('dragenter', onUIModulePickerDragEnter);
			document.getElementById('outfitting_modules_container').removeEventListener('dragover', onUIModulePickerDragOver);
			document.getElementById('outfitting_modules_container').removeEventListener('dragleave', onUIModulePickerDragLeave);
		}
		document.getElementById('outfitting_fit_ship_hull').className = (isNaN(modid) ? '' : 'dragerror');
		document.getElementById('outfitting_fit_ship_hatch').className = (isNaN(modid) ? '' : 'dragerror');
		for (var sg = 0;  sg < GROUPS.length;  sg++) {
			var slotgroup = GROUPS[sg];
			var slot;
			for (var slotnum = 0;  slot = current.fit.getSlot(slotgroup, slotnum);  slotnum++) {
				var tr = document.getElementById('outfitting_fit_slot_' + slotgroup + '_' + slotnum);
				if (isNaN(modid)) {
					tr.className = '';
					tr.removeEventListener('dragenter', onUIFitSlotsDragEnter);
					tr.removeEventListener('dragover', onUIFitSlotsDragOver);
					tr.removeEventListener('dragleave', onUIFitSlotsDragLeave);
				} else if (!(current.option.experimental ? slot.isModuleIDValid(modid) : slot.isModuleIDAllowed(modid))) {
					tr.className = 'dragerror';
					tr.removeEventListener('dragenter', onUIFitSlotsDragEnter);
					tr.removeEventListener('dragover', onUIFitSlotsDragOver);
					tr.removeEventListener('dragleave', onUIFitSlotsDragLeave);
				} else {
					tr.className = 'dragok';
					tr.addEventListener('dragenter', onUIFitSlotsDragEnter);
					tr.addEventListener('dragover', onUIFitSlotsDragOver);
					tr.addEventListener('dragleave', onUIFitSlotsDragLeave);
				}
			}
		}
	}; // setCurrentDrag()


	/*
	* EXPORT/IMPORT
	*/


	var showUIExportPopup = function() {
		var trigger = document.getElementById('outfitting_fit_export');
		var table = showUITablePopup(null, trigger, false, false, false);
		table.className = '';
		while (table.lastChild)
			table.removeChild(table.lastChild);
		var tbody = document.createElement('tbody');

		var tr = document.createElement('tr');
		var td = createTranslatedElement('td', 'ui-export-build');
		tr.appendChild(td);
		var td = document.createElement('td');
		td.colSpan = 2;
		var span = createTranslatedElement('span', 'ship-'+current.fit.getShipID());
		span.className = 'text';
		td.appendChild(span);
		var shipname = current.fit.getName();
		var shiptag = current.fit.getNameTag();
		td.appendChild(document.createTextNode((shipname ? (' "' + shipname + '"') : '') + (shiptag ? (' ' + shiptag) : '')));
		tr.appendChild(td);
		tbody.appendChild(tr);

		var tr = document.createElement('tr');
		var td = createTranslatedElement('td', 'ui-export-url');
		tr.appendChild(td);
		var td = document.createElement('td');
		td.className = 'export';
		var div = document.createElement('div');
		div.className = 'export';
		var input = document.createElement('input');
		input.type = 'text';
		input.size = 50;
		input.className = 'export';
		input.name = 'export_url';
		input.value = current.fit.getEDSYURL();
		input.addEventListener('focus', onUIPopupExportFieldFocus);
		div.appendChild(input);
		td.appendChild(div);
		tr.appendChild(td);
		var td = document.createElement('td');
		var button = document.createElement('button');
		button.appendChild(createIcon('clipboard'));
		button.addEventListener('click', onUIPopupExportCopyButtonClick);
		td.appendChild(button);
		tr.appendChild(td);
		tbody.appendChild(tr);

		var tr = document.createElement('tr');
		var td = createTranslatedElement('td', 'ui-export-text');
		tr.appendChild(td);
		var td = document.createElement('td');
		td.className = 'export';
		var div = document.createElement('div');
		div.className = 'export';
		var textarea = document.createElement('textarea');
		textarea.cols = 50;
		textarea.rows = 8;
		textarea.className = 'export';
		textarea.name = 'export_text';
		textarea.value = current.fit.exportText();
		textarea.addEventListener('focus', onUIPopupExportFieldFocus);
		div.appendChild(textarea);
		td.appendChild(div);
		tr.appendChild(td);
		var td = document.createElement('td');
		var button = document.createElement('button');
		button.appendChild(createIcon('clipboard'));
		button.addEventListener('click', onUIPopupExportCopyButtonClick);
		td.appendChild(button);
		tr.appendChild(td);
		tbody.appendChild(tr);

		var tr = document.createElement('tr');
		var td = createTranslatedElement('td', 'ui-export-slef');
		tr.appendChild(td);
		var td = document.createElement('td');
		td.className = 'export';
		var div = document.createElement('div');
		div.className = 'export';
		var input = document.createElement('input');
		input.type = 'text';
		input.size = 50;
		input.className = 'export';
		input.name = 'export_slef';
		input.value = current.fit.exportSLEF();
		input.addEventListener('focus', onUIPopupExportFieldFocus);
		div.appendChild(input);
		td.appendChild(div);
		tr.appendChild(td);
		var td = document.createElement('td');
		var button = document.createElement('button');
		button.appendChild(createIcon('clipboard'));
		button.addEventListener('click', onUIPopupExportCopyButtonClick);
		td.appendChild(button);
		tr.appendChild(td);
		tbody.appendChild(tr);

		var url_inara_search = current.fit.getInaraSearchURL();
		var url_inara_export = current.fit.getInaraBuildURL();

		var tr = document.createElement('tr');
		var td = createTranslatedElement('td', 'ui-export-external');
		tr.appendChild(td);
		var td = document.createElement('td');
		td.className = 'export';
		var div = document.createElement('div');
		div.className = 'export';
		var link = document.createElement('a');
		link.className = 'button text';
		if (url_inara_search) {
			link.href = url_inara_search;
			link.target = '_blank';
		}
		var img = document.createElement('img');
		img.src = 'inara.png';
		link.append(img, ' ', createTranslatedElement('span', 'ui-export-search-inara'));
		div.appendChild(link);
		if (url_inara_export) {
			var button = document.createElement('button');
			button.className = 'text';
			button.name = 'export_inara';
			button.append(img.cloneNode(true), ' ', createTranslatedElement('span', 'ui-export-update-inara'));
			button.addEventListener('click', onUIFitExportInaraButtonClick);
			div.appendChild(button);
		}

		td.appendChild(div);
		tr.appendChild(td);
		var td = document.createElement('td');
		tr.appendChild(td);
		tbody.appendChild(tr);

		table.appendChild(tbody);
		document.forms.popup.elements.export_url.focus();
		document.forms.popup.elements.export_url.select();
		return true;
	}; // showUIExportPopup()


	var showUIImportPopup = function() {
		var df = document.createDocumentFragment();
		df.appendChild(createTranslatedElement('span', 'ui-import-footer-desc'));
		showUITextPopup(
				df,
				getTranslation('ui-import-textbox-notes'),
				null, false,
				importData, true
		);
	}; // showUIImportPopup()


	var createUIImportedBuildHeader = function() {
		var thead = document.createElement('thead');
		var tr = document.createElement('tr');

		var th = document.createElement('th');
		th.className = 'colgroup stickytopleft';
		var abbr = createTranslatedElement('abbr', 'ui-import-ship-label');
		abbr.setAttribute('edsy-title', 'ui-import-ship-desc');
		abbr.title = 'Ship type';
		th.appendChild(abbr);
		tr.appendChild(th);

		var th = document.createElement('th');
		th.className = 'colgroup tac stickytop';
		var abbr = createTranslatedElement('abbr', 'ui-import-number-label');
		abbr.setAttribute('edsy-title', 'ui-import-number-desc');
		abbr.title = 'Ship purchase number';
		th.appendChild(abbr);
		tr.appendChild(th);

		var th = document.createElement('th');
		th.className = 'colgroup stickytop';
		var abbr = createTranslatedElement('abbr', 'ui-import-name-label');
		abbr.setAttribute('edsy-title', 'ui-import-name-desc');
		abbr.title = 'Ship name';
		th.appendChild(abbr);
		tr.appendChild(th);

		var th = document.createElement('th');
		th.className = 'colgroup stickytop';
		var abbr = createTranslatedElement('abbr', 'ui-import-id-label');
		abbr.setAttribute('edsy-title', 'ui-import-id-desc');
		abbr.title = 'Ship ID tag';
		th.appendChild(abbr);
		tr.appendChild(th);

		var th = document.createElement('th');
		th.className = 'colgroup stickytop tac';
		var abbr = createTranslatedElement('abbr', 'ui-import-errors-label');
		abbr.setAttribute('edsy-title', 'ui-import-errors-desc');
		abbr.title = 'Import errors';
		th.appendChild(abbr);
		tr.appendChild(th);

		var th = document.createElement('th');
		th.className = 'colgroup first stickytop';
		var actions = ['ignore','save','saveas'];
		for (var a = 0;  a < actions.length;  a++) {
			var button = document.createElement('button');
			button.className = 'import_' + actions[a];
			button.name = 'import_' + actions[a];
			button.appendChild(createIcon(actions[a]));
			button.addEventListener('click', onUIPopupImportButtonClick);
			th.appendChild(button);
		}
		var abbr = createTranslatedElement('abbr', 'ui-import-stored-label');
		abbr.setAttribute('edsy-title', 'ui-import-stored-desc');
		abbr.title = 'Stored build label';
		th.appendChild(abbr);
		tr.appendChild(th);

		var th = document.createElement('th');
		th.className = 'colgroup first stickytop';
		var button = document.createElement('button');
		button.name = 'import_load_none';
		button.appendChild(createIcon('import'));
		button.addEventListener('click', onUIPopupImportButtonClick);
		th.appendChild(button);
		tr.appendChild(th);

		thead.appendChild(tr);
		return thead;
	}; // createUIImportedBuildHeader()


	var createUIImportedBuildRow = function(importobj, multiple) {
		var index = importobj.index;
		var fleetid = importobj.fleetid;
		var build = importobj.build;
		var shipid = (build ? build.getShipID() : -1);
		var builderrors = importobj.builderrors;
		var namehash = importobj.namehash || '';
		var defaultaction = ((build && namehash) ? ((current.stored.shipNamehashStored[shipid] || EMPTY_OBJ)[namehash] ? 'save' : (multiple ? 'saveas' : 'ignore')) : 'ignore');

		var tr = document.createElement('tr');

		var td = createTranslatedElement('td', (build ? ('ship-'+shipid) : ''));
		td.className = 'colgroup text stickyleft';
		tr.appendChild(td);

		var td = createTranslatedElement('td', 'interp-number', {'number':(fleetid || undefined)});
		td.className = 'colgroup tac';
		tr.appendChild(td);

		var td = document.createElement('td');
		td.className = 'colgroup';
		td.innerHTML = (build ? encodeHTML(build.getName()) : '');
		tr.appendChild(td);

		var td = document.createElement('td');
		td.className = 'colgroup';
		td.innerHTML = (build ? encodeHTML(build.getNameTag()) : '');
		tr.appendChild(td);

		var td = document.createElement('td');
		td.className = 'colgroup tac';
		if (builderrors.length > 0) {
			var abbr = createTranslatedElement('abbr', 'interp-number', {'number':builderrors.length});
			abbr.title = builderrors.join('\n');
			td.appendChild(abbr);
		} else {
			td.innerHTML = formatNumHTML(0);
		}
		tr.appendChild(td);

		// prepare the select now, so we can make sure it has entries
		var select = document.createElement('select');
		select.className = 'import_save_label';
		select.name = 'import_save_label_' + index;
		var option = document.createElement('option');
		option.value = '';
		option.text = '';
		select.appendChild(option);
		populateDOMSelectStoreds(select, current.stored.shipStoreds[shipid], namehash, 1);
		if (select.options.length < 2) {
			if (defaultaction === 'save')
				defaultaction = 'saveas';
		}

		var td = document.createElement('td');
		td.className = 'colgroup first import_store';
		var div = document.createElement('div');
		div.className = 'import_store';
		var actions = ['ignore','save','saveas'];
		for (var a = 0;  a < actions.length;  a++) {
			var input = document.createElement('input');
			input.id = 'import_store_' + index + '_' + actions[a];
			input.className = 'toggleinput import_' + actions[a];
			input.type = 'radio';
			input.name = 'import_store_' + index;
			input.value = actions[a];
			input.checked = (actions[a] == defaultaction);
			input.disabled = (actions[a] === 'save' && select.options.length < 2) || (actions[a] !== 'ignore' && !build);
			div.appendChild(input);
			var label = document.createElement('label');
			label.className = 'togglebutton';
			label.htmlFor = input.id;
			label.appendChild(createIcon(actions[a]));
			div.appendChild(label);
		}
		var span = createTranslatedElement('span', 'ui-import-ignore');
		span.className = 'import_ignore_label';
		div.appendChild(span);
		div.appendChild(select);
		var input = document.createElement('input');
		input.className = 'import_saveas_label';
		input.type = 'text';
		input.name = 'import_saveas_label_' + index;
		input.value = hashDecodeS(namehash);
		div.appendChild(input);
		var abbr = document.createElement('abbr');
		abbr.id = 'import_warning_' + index;
		abbr.style.display = 'none';
		abbr.appendChild(createIcon('warning'));
		abbr.title = '';
		div.appendChild(abbr);
		td.appendChild(div);
		tr.appendChild(td);

		var td = document.createElement('td');
		td.className = 'colgroup first';
		var input = document.createElement('input');
		input.id = 'import_load_' + index;
		input.className = 'toggleinput';
		input.type = 'radio';
		input.name = 'import_load';
		input.value = index;
		input.disabled = !build;
		td.appendChild(input);
		var label = document.createElement('label');
		label.className = 'togglebutton';
		label.htmlFor = input.id;
		label.appendChild(createIcon('import'));
		td.appendChild(label);
		tr.appendChild(td);

		return tr;
	}; // createUIImportedBuildRow()


	var importData = function(text, msieURLtrunc) {
		text = text.trim();
		if (!text)
			return true;
		if (current.dev)
			console.log(text);

		// initialize storage for possibly decoding multiple builds
		var errors = [];
		var importdata = {
			imports: null,
			buildlist: [],
			modules: null,
			warning: document.createDocumentFragment(),
		};
		var curindex = -1;

		// identify the format by the first line
		var eol = text.indexOf('\n');
		var line1 = text.slice(0, (eol < 0) ? 100 : eol).trim();
		if (line1.match(/^[a-z]+:\/\/[^#]*(edshipyard|edsy)[^#]*#/i)) { // URL hash(es)
			var urls = text.match(/[a-z]+:\/\/[^#]+#[^ \t\r\n#]*/ig);
			for (var i = 0;  i < urls.length;  i++) {
				var urlhash = urls[i].slice(urls[i].indexOf('#'));
				var parts = urlhash.split('/');
				if (parts[0] === '#') {
					for (var p = 1;  p < parts.length;  p++) {
						if (parts[p].slice(0,2) === 'L=') {
							var index = importdata.buildlist.length;
							var builderrors = [];
							var build = Build.fromHash(parts[p].slice(2), builderrors);
							var importhash = build ? ('url|' + build.getShipID() + '|' + hashEncodeS(build.getName().toUpperCase()) + '|' + hashEncodeS(build.getNameTag().toUpperCase())) : null;
							importdata.buildlist[index] = { index:index, importhash:importhash, fleetid:null, namehash:null, build:build, builderrors:builderrors };
							if (build)
								curindex = index;
						} else if (parts[p].slice(0,2) === 'I=') {
							errors.push('Nested import URL hash: ' + urlhash.slice(0,8) + (urlhash.length > 8 ? '...' : ''));
						}
					}
				} else {
					errors.push('Invalid URL hash: ' + urlhash.slice(0,8) + (urlhash.length > 8 ? '...' : ''));
				}
			}
		} else if (line1.match(/^\[[ a-z0-9_-]+(,[^\[\]]+)?\] *(\[[^\[\]]+\])?$/i)) { // plain text
			// TODO: plain text import? does anybody actually use it?
			errors.push(getTranslation('ui-import-error-text'));
		} else if (line1[0] === '[' || line1[0] === '{') {
			var json = null;
			try {
				json = JSON.parse(text);
			} catch (exc) {
				json = null;
			}
			if (!json) {
				try {
					// maybe it's line-delimited (i.e. a full Journal file)
					text = '[ '+text.replace(/\}[ \t]*[\r\n]+[ \t]*\{/g,'}, {')+' ]';
					json = JSON.parse(text);
				} catch (exc) {
					json = null;
				}
			}
			if (json) {
				if (json['format'] === 'edsy') { // EDSY backup
					if (json['imports']) {
						importdata.imports = importdata.imports || {};
						for (var importhash in json['imports']) {
							importdata.imports[importhash] = json['imports'][importhash];
						}
					}
					for (var i = 0;  i < (json['buildlist'] || EMPTY_ARR).length;  i++) {
						var index = importdata.buildlist.length;
						var builderrors = [];
						var namehash = json['buildlist'][i]['label'];
						var build = Build.fromHash(json['buildlist'][i]['hash'], builderrors);
						importdata.buildlist[index] = { index:index, importhash:null, fleetid:null, namehash:namehash, build:build, builderrors:builderrors };
					}
					for (var namehash in (json['builds'] || EMPTY_OBJ)) {
						var index = importdata.buildlist.length;
						var builderrors = [];
						var build = Build.fromHash(json['builds'][namehash], builderrors);
						importdata.buildlist[index] = { index:index, importhash:null, fleetid:null, namehash:namehash, build:build, builderrors:builderrors };
					}
					if (json['modules']) {
						importdata.modules = importdata.modules || {};
						for (var namehash in json['modules']) {
							importdata.modules[namehash] = json['modules'][namehash];
						}
					}
					importdata.options = json['options'];
					curindex = -1;
				} else if (json.length > 0 && (json[0]['header'] || EMPTY_OBJ)['appName'] && (json[0]['data'] || EMPTY_OBJ)['Ship']) { // EDCD SLEF
					for (var i = 0;  i < json.length;  i++) {
						var slefApp = ((json[i]['header'] || EMPTY_OBJ)['appName'] || '').trim();
						var index = importdata.buildlist.length;
						var builderrors = [];
						var build = Build.fromJournal(json[i]['data'], builderrors, json[i]['header']);
						var importhash = build ? ('slef|' + hashEncodeS(slefApp || '') + '|' + build.getShipID() + '|' + hashEncodeS(build.getName().toUpperCase()) + '|' + hashEncodeS(build.getNameTag().toUpperCase())) : null;
						importdata.buildlist[index] = { index:index, importhash:importhash, fleetid:null, namehash:null, build:build, builderrors:builderrors };
						if (build) {
							curindex = index;
							if (slefApp.toUpperCase() === 'INARA') {
								importdata.warning.append(createTranslatedElement('span', 'ui-import-warning-inara'));
							}
						}
					}
				} else if (((json['$schema'] || ((json[0] || EMPTY_OBJ)['$schema'])) || '').indexOf('coriolis.io') >= 0) { // Coriolis detailed export
					errors.push(getTranslation('ui-import-error-coriolis'));
				} else if (json['event'] || (json[0] || EMPTY_OBJ)['event']) { // journal event(s)
					if (isNaN(json.length)) {
						json = [ json ];
					}
					// scan it backwards so that the order reflects the most recent event for each ship
					var fleetids = {};
					var slotCraft = null;
					var i = json.length;
					while (i-- > 0) {
						if (json[i]['event'] === 'EngineerCraft') {
							var slot = json[i]['Slot'];
							if (!slotCraft)
								slotCraft = {};
							if (!slotCraft[slot])
								slotCraft[slot] = json[i];
						} else if (json[i]['event'] === 'Loadout') {
							var fleetid = json[i]['ShipID'] || -i;
							if (!fleetids[fleetid]) {
								for (var s = 0;  s < json[i]['Modules'].length;  s++) {
									var slot = json[i]['Modules'][s]['Slot'];
									if ((slotCraft || EMPTY_OBJ)[slot] && slotCraft[slot]['Module'].toLowerCase() === json[i]['Modules'][s]['Item'].toLowerCase()) {
										json[i]['Modules'][s]['Engineering'] = slotCraft[slot];
									}
								}
								var index = importdata.buildlist.length;
								var builderrors = [];
								var build = Build.fromJournal(json[i], builderrors);
								var importhash = build ? ('journal|' + build.getShipID() + '|' + max(0,fleetid) + '|' + hashEncodeS(build.getName().toUpperCase()) + '|' + hashEncodeS(build.getNameTag().toUpperCase())) : null;
								importdata.buildlist[index] = { index:index, importhash:importhash, fleetid:fleetid, namehash:null, build:build, builderrors:builderrors };
								fleetids[fleetid] = true;
							}
							slotCraft = null;
						}
					}
					// now reverse the imports to restore the original journal order
					importdata.buildlist.reverse();
					for (var i = 0;  i < importdata.buildlist.length;  i++) {
						importdata.buildlist[i].index = i;
						if (importdata.buildlist[i].build)
							curindex = i;
					}
				} else {
					errors.push(getTranslation('ui-import-error-unrecognized-json'));
				}
			} else {
				errors.push(getTranslation('ui-import-error-invalid-json'));
				if (msieURLtrunc)
					errors.push(getTranslation('ui-import-error-truncated'));
			}
		} else {
			errors.push(getTranslation('ui-import-error-unrecognized'));
		}

		// see what we got
		var imported = false;
		if (importdata.buildlist.length > 0 || importdata.imports || importdata.modules) {
			current.importdata = importdata;
			var html = createTranslatedElement('span', 'interp-found-number-builds', {'number':importdata.buildlist.length});
			var trigger = document.getElementById('outfitting_fit_import');
			var table = showUITablePopup(html, trigger, true, importDataOkay, importDataCancel);
			table.className = 'striped';
			while (table.lastChild)
				table.removeChild(table.lastChild);
			var thead = createUIImportedBuildHeader();
			table.appendChild(thead);
			var tbody = document.createElement('tbody');
			for (var i = 0;  i < importdata.buildlist.length;  i++) {
				var importbuild = importdata.buildlist[i];
				// if a namehash wasn't provided, try the importhash history or generate a default label
				if (!importbuild.namehash) {
					if (importbuild.importhash && (importbuild.importhash in current.importLabel)) {
						importbuild.namehash = current.importLabel[importbuild.importhash];
					} else if (importbuild.build) {
						importbuild.namehash = hashEncodeS(eddb.ship[importbuild.build.getShipID()].name + (importbuild.fleetid ? (' #' + importbuild.fleetid) : ''));
					}
				}
				tbody.appendChild(createUIImportedBuildRow(importbuild, importdata.buildlist.length > 1));
			}
			table.appendChild(tbody);
			updateTranslations(table);
			var el = document.getElementById('import_load_' + curindex);
			if (el && !el.disabled)
				el.checked = true;

			var numModules=0, numModulesOW=0, extras=false;
			extras = importdata.imports || importdata.modules || importdata.options;
			for (var namehash in (importdata.modules || EMPTY_OBJ)) {
				// skip builtins, if they snuck in somehow
				if (!hashDecodeS(namehash).startsWith(" ")) {
					numModules += 1;
					numModulesOW += (current.stored.moduleNamehashStored[0][namehash] ? 1 : 0);
				}
			}

			var status = document.getElementById('popup_status');
			if (extras) {
				var label = document.createElement('label');
				label.className = 'checkbox left';
				var input = document.createElement('input');
				input.type = 'checkbox';
				input.name = 'import_extras';
				input.checked = true;
				label.appendChild(input);
				var div = document.createElement('div');
				var divCheck = document.createElement('div');
				divCheck.className = 'check';
				div.append(divCheck, ' ', createTranslatedElement('span', 'interp-import-number-modules-overwrite', {'number':numModules, 'overwrite':numModulesOW}));
				label.appendChild(div);
				status.appendChild(label);
			}
			if (importdata.warning.firstChild) {
				var div = document.createElement('div');
				div.append(createIcon('warning'), ' ', importdata.warning);
				status.appendChild(div);
			}
			updateTranslations(status);

			imported = true;
		/* always use bulk import window
		} else if (importdata.buildlist.length == 1) {
			var importbuild = importdata.buildlist[0];
			if (importbuild.build) {
				setCurrentFit(importbuild.build);
				if (importbuild.builderrors.length > 0) {
					alert('Build imported with errors:\n\n' + importbuild.builderrors.join('\n'))
				}
				imported = true;
			} else {
				alert('Import failed:\n\n' + importbuild.builderrors.join('\n'));
			}
		*/
		} else {
			errors.push(getTranslation('ui-import-no-builds'));
			alert(getTranslation('ui-import-failed') + '\n\n' + errors.join('\n'));
		}
		return imported;
		/*
				b64text = text; // TODO debug
				if (!b64text) {
					try {
						b64text = text.replace(/[ \t\r\n]+/g, '');
						b64text = b64Encode(pako.gzip(b64text, {to:'string'}));
						b64text = b64text.replace(/.{80}/g, function(a) { return a+'\n'; });
					} catch (exc) {
						b64text = text;
					}

				}
		*/
	}; // importData()


	var importDataOkay = function() {
		var ok = true;
		var namehashIndex = {};
		for (var i = 0;  i < current.importdata.buildlist.length;  i++) {
			var importbuild = current.importdata.buildlist[i];
			var message = '';
			var input_action = document.forms.popup.elements['import_store_' + i];
			var label_save = document.forms.popup.elements['import_save_label_' + i];
			var label_saveas = document.forms.popup.elements['import_saveas_label_' + i];
			var namehash = '';
			if (!importbuild.build) {
				// no build to store
			} else if (input_action.value === 'save') {
				namehash = label_save.value.trim();
				if (!namehash) {
					message = 'message-build-save';
				}
			} else if (input_action.value === 'saveas') {
				namehash = hashEncodeS(label_saveas.value.trim());
				if (!namehash) {
					message = 'message-build-save';
				} else if (current.stored.shipNamehashStored[0][namehash]) {
					message = 'message-build-overwrite';
					input_action.value = 'save';
					label_save.value = namehash;
					if (label_save.selectedIndex < 1) {
						var option = document.createElement('option');
						option.value = namehash;
						option.text = label_saveas.value.trim();
						option.selected = true;
						label_save.appendChild(option);
					}
				}
			}
			if (!namehash) {
				// don't store this build
				importbuild.namehash = namehash;
			} else if (namehashIndex[namehash]) {
				message = 'ui-import-error-duplicate';
			} else {
				namehashIndex[namehash] = i;
				importbuild.namehash = namehash;
			}
			var warning = document.getElementById('import_warning_' + i);
			warning.setAttribute('edsy-title', message);
			warning.title = getTranslation(message);
			warning.style.display = message ? 'block' : 'none';
			ok = ok && !message;
		}
		if (ok) {
			var input_extras = document.forms.popup.elements['import_extras'];
			if (input_extras && input_extras.checked) {
				for (var importhash in (current.importdata.imports || EMPTY_OBJ)) {
					setStoredImport(importhash, current.importdata.imports[importhash]);
				}
				for (var namehash in (current.importdata.modules || EMPTY_OBJ)) {
					// skip builtins
					var name = hashDecodeS(namehash);
					if (!name.startsWith(" ")) {
						var modulehash = current.importdata.modules[namehash];
						var modid = Slot.getStoredHashModuleID(modulehash);
						var stored = {
							modid:modid,
							namehash:namehash,
							name:name,
							modulehash:modulehash,
							engineer:Slot.isStoredHashModified(modulehash),
						};
						if (!current.stored.moduleNamehashStored[modid])
							current.stored.moduleNamehashStored[modid] = {};
						current.stored.moduleNamehashStored[0][namehash] = current.stored.moduleNamehashStored[modid][namehash] = stored;
						current.stored.moduleStoreds[0] = current.stored.moduleStoreds[modid] = null;
						current.stored.modulehashStored[modulehash] = stored;
					}
				}
				for (var modid in current.stored.moduleNamehashStored) {
					if (!current.stored.moduleStoreds[modid]) {
						current.stored.moduleStoreds[modid] = Object.values(current.stored.moduleNamehashStored[modid]);
						current.stored.moduleStoreds[modid].sort(sortStoreds);
					}
				}
				for (var opt in (current.importdata.options || EMPTY_OBJ)) {
					if (current.option[opt] !== undefined)
						current.option[opt] = current.importdata.options[opt];
				}
			}
			for (var i = 0;  i < current.importdata.buildlist.length;  i++) {
				var importbuild = current.importdata.buildlist[i];
				if (importbuild.importhash) {
					setStoredImport(importbuild.importhash, importbuild.namehash);
				}
				if (importbuild.build && importbuild.namehash) {
					var shipid = importbuild.build.getShipID();
					var buildhash = importbuild.build.getHash();
					var stored = {
						shipid:shipid,
						namehash:importbuild.namehash,
						name:hashDecodeS(importbuild.namehash),
						buildhash:buildhash
					};
					if (!current.stored.shipNamehashStored[shipid])
						current.stored.shipNamehashStored[shipid] = {};
					current.stored.shipNamehashStored[0][importbuild.namehash] = current.stored.shipNamehashStored[shipid][importbuild.namehash] = stored;
					current.stored.shipStoreds[0] = current.stored.shipStoreds[shipid] = null;
				}
			}
			for (var shipid in current.stored.shipNamehashStored) {
				if (!current.stored.shipStoreds[shipid]) {
					current.stored.shipStoreds[shipid] = Object.values(current.stored.shipNamehashStored[shipid]);
					current.stored.shipStoreds[shipid].sort(sortStoreds);
				}
			}
			writeStoredOptions();
			writeStoredImports();
			writeStoredBuilds();
			writeStoredModules();
			updateUIOptions();
			updateUIShipyardStoredBuilds();
			var build = (current.importdata.buildlist[document.forms.popup.elements.import_load.value] || EMPTY_OBJ).build;
			if (build) {
				setCurrentFit(build);
				setUIPageTab('outfitting');
			} else {
				updateUIFitStoredBuilds();
			}
			sortCache(true); // affected by options
			initUIModulePicker();
			updateUIModulePickerStoredModules();
			updateUIModulePickerWarnings();
			updateUIDetailsStoredModules();
			updateUIDetailsStoredModuleControls();
			current.importdata = null;
			loadTranslations(true); // async
		} else {
			var html = createTranslatedElement('span', 'ui-import-warning-invalid');
			var trigger = document.getElementById('outfitting_fit_import');
			showUITablePopup(html, trigger, true, importDataOkay, importDataCancel);
		}
	}; // importDataOkay()


	var importDataCancel = function() {
		current.importdata = null;
	}; // importDataCancel()


	var getFdevImportMap = function() {
		if (!cache.fdevmap) {
			var fdevmap = {
				ship: {},
				slotGroup: {
					HUGEHARDPOINT    : 'hardpoint',
					LARGEHARDPOINT   : 'hardpoint',
					MEDIUMHARDPOINT  : 'hardpoint',
					SMALLHARDPOINT   : 'hardpoint',
					HUGEMININGHARDPOINT   : 'hardpoint',
					LARGEMININGHARDPOINT  : 'hardpoint',
					MEDIUMMININGHARDPOINT : 'hardpoint',
					SMALLMININGHARDPOINT  : 'hardpoint',
					TINYHARDPOINT    : 'utility',
					MILITARY         : 'military',
					SLOT             : 'internal',
					CARGO            : 'internal',
					LIMPETCONTROLLER : 'internal',
					FIGHTERBAY       : 'internal',
				},
				slotNum: {},
				shipModule: {},
				module: {},
				mtypeBlueprint: {},
				expeffect: {},
				attrField: {},
				fieldAttr: {},
			};
			for (var s = 0;  s < CORE_SLOT_FDNAME.length;  s++) {
				fdevmap.slotGroup[CORE_SLOT_FDNAME[s].toUpperCase()] = 'component';
				fdevmap.slotNum[CORE_SLOT_FDNAME[s].toUpperCase()] = s;
			}

			// current ship and ship-module mappings
			for (var shipid in eddb.ship) {
				var ship = eddb.ship[shipid];
				var fdid = ship.fdid;
				if (fdid)
					fdevmap.ship[fdid] = shipid;
				var fdname = (ship.fdname || '').trim().toUpperCase();
				if (fdname)
					fdevmap.ship[fdname] = shipid;

				fdevmap.shipModule[shipid] = {};
				for (var modid in ship.module) {
					var fdid = ship.module[modid].fdid || eddb.module[modid].fdid;
					if (fdid)
						fdevmap.shipModule[shipid][fdid] = modid;
					var fdname = (ship.module[modid].fdname || eddb.module[modid].fdname || '').trim().toUpperCase();
					if (fdname)
						fdevmap.shipModule[shipid][fdname] = modid;
				}
			}

			// current module mappings
			for (var modid in eddb.module) {
				var module = eddb.module[modid];
				var fdid = module.fdid;
				if (fdid)
					fdevmap.module[fdid] = modid;
				var fdname = (module.fdname || '').trim().toUpperCase();
				if (fdname)
					fdevmap.module[fdname] = modid;
			}

			// obsolete modules
			fdevmap.module['INT_STELLARBODYDISCOVERYSCANNER_STANDARD'] = -1;
			fdevmap.module['INT_STELLARBODYDISCOVERYSCANNER_INTERMEDIATE'] = -1;
			fdevmap.module['INT_STELLARBODYDISCOVERYSCANNER_ADVANCED'] = -1;

			// blueprint mappings are per-mtype
			for (var mtypeid in eddb.mtype) {
				// current blueprint mappings
				fdevmap.mtypeBlueprint[mtypeid] = {};
				var mtype = eddb.mtype[mtypeid];
				for (var b = 0;  b < (mtype.blueprints || EMPTY_ARR).length;  b++) {
					var bpid = mtype.blueprints[b];
					if (eddb.blueprint[bpid]) {
						var fdname = (eddb.blueprint[bpid].fdname || '').trim().toUpperCase();
						fdevmap.mtypeBlueprint[mtypeid][fdname] = bpid;
					}
				}

				// renamed blueprint mappings
				for (var bpname in { LIGHTWEIGHT:1, REINFORCED:1, SHIELDED:1 }) {
					if (fdevmap.mtypeBlueprint[mtypeid]['MISC_' + bpname]) {
						for (var modtype in { CHAFFLAUNCHER:1, ECM:1, HEATSINKLAUNCHER:1, KILLWARRANTSCANNER:1, CARGOSCANNER:1, POINTDEFENCE:1, WAKESCANNER:1, LIFESUPPORT:1, COLLECTIONLIMPET:1, FUELTRANSFERLIMPET:1, HATCHBREAKERLIMPET:1, PROSPECTINGLIMPET:1 }) {
							fdevmap.mtypeBlueprint[mtypeid][modtype + '_' + bpname] = fdevmap.mtypeBlueprint[mtypeid]['MISC_' + bpname];
						}
					}
				}
				for (var bpname in { FASTSCAN:1, LONGRANGE:1, WIDEANGLE:1 }) {
					if (fdevmap.mtypeBlueprint[mtypeid]['SENSOR_' + bpname]) {
						for (var modtype in { SENSOR_KILLWARRANTSCANNER:1, KILLWARRANTSCANNER:1, SENSOR_CARGOSCANNER:1, SENSOR_WAKESCANNER:1, SENSOR_SENSOR:1, SENSOR_SURFACESCANNER:1 }) {
							fdevmap.mtypeBlueprint[mtypeid][modtype + '_' + bpname] = fdevmap.mtypeBlueprint[mtypeid]['SENSOR_' + bpname];
						}
					}
				}
				fdevmap.mtypeBlueprint[mtypeid]['CHAFFLAUNCHER_CHAFFCAPACITY'] = fdevmap.mtypeBlueprint[mtypeid]['MISC_CHAFFCAPACITY'];
				fdevmap.mtypeBlueprint[mtypeid]['HEATSINKLAUNCHER_HEATSINKCAPACITY'] = fdevmap.mtypeBlueprint[mtypeid]['MISC_HEATSINKCAPACITY'];
				fdevmap.mtypeBlueprint[mtypeid]['POINTDEFENCE_POINTDEFENSECAPACITY'] = fdevmap.mtypeBlueprint[mtypeid]['MISC_POINTDEFENSECAPACITY'];
				fdevmap.mtypeBlueprint[mtypeid]['SENSOR_SENSOR_LIGHTWEIGHT'] = fdevmap.mtypeBlueprint[mtypeid]['SENSOR_LIGHTWEIGHT'];
				if (fdevmap.mtypeBlueprint[mtypeid]['MISC_SHIELDED']) {
					for (var modtype in { AFM:1, FUELSCOOP:1, REFINERIES:1 }) {
						fdevmap.mtypeBlueprint[mtypeid][modtype + '_SHIELDED'] = fdevmap.mtypeBlueprint[mtypeid]['MISC_SHIELDED'];
					}
				}
				fdevmap.mtypeBlueprint[mtypeid]['GUARDIANWEAPON_STURDY'] = fdevmap.mtypeBlueprint[mtypeid]['GUARDIANMODULE_STURDY'];
			}

			// expeffect mappings are (now) bi-directional
			for (var expid in eddb.expeffect) {
				var fdexpid = eddb.expeffect[expid].fdname;
				if (fdexpid)
					fdevmap.expeffect[fdexpid.toUpperCase()] = expid;
			}

			// attr mappings are (now) bi-directional, except for some special cases
			for (var i = 0;  i < eddb.attributes.length;  i++) {
				var attribute = eddb.attributes[i];
				if (attribute.attr)
					fdevmap.attrField[attribute.attr] = attribute.fdattr;
				if (attribute.fdattr)
					fdevmap.fieldAttr[attribute.fdattr] = attribute.attr;
			}
			for (var fdattr in eddb.fdfieldattr) {
				var attr = eddb.fdfieldattr[fdattr];
				fdevmap.fieldAttr[fdattr] = attr;
			}

			cache.fdevmap = fdevmap;
		}
		return cache.fdevmap;
	}; // getFdevImportMap()


	/*
	* OUTFITTING PICKER UI
	*/


	var initUIModulePicker = function() {
		// (re)build picker DOM
		var divPicker = document.getElementById('outfitting_modules_picker');
		if (divPicker) {
			divPicker.parentNode.removeChild(divPicker);
			divPicker.replaceChildren();
		} else {
			divPicker = document.createElement('div');
			divPicker.id = 'outfitting_modules_picker';
		}

		var divRow = document.createElement('div');
		divRow.className = 'row empty';
		var label = document.createElement('label');
		label.className = 'togglebutton';
		label.draggable = true;
		var input = document.createElement('input');
		input.type = 'radio';
		input.id = 'outfitting_module.0.';
		input.name = 'module';
		input.value = '0.';
		var div = document.createElement('div');
		label.appendChild(input);
		label.appendChild(div);
		label.htmlFor = input.id;
		label.addEventListener('touchstart', onUIModulePickerLabelTouchStart);
		divRow.appendChild(label);
		divPicker.appendChild(divRow);
		divRow = null;

		for (var g = 0;  g < GROUPS.length;  g++) {
			var group = GROUPS[g];
			if (!cache.groupMtypes[group] || cache.groupMtypes[group].length < 1)
				continue;

			var divGroup = document.createElement('div');
			divGroup.id = 'outfitting_modules_group_' + group;
			divGroup.className = 'group ' + group;
			var header = createTranslatedElement('header', 'ui-slotgroup-'+GROUPS[g]);
			divGroup.appendChild(header);

			for (var t = 0;  t < cache.groupMtypes[group].length;  t++) {
				var mtype = cache.groupMtypes[group][t];

				var typeSizeMin = MAX_SLOT_CLASS;
				var typeSizeMax = 0;
				var divType = document.createElement('div');
				divType.id = 'outfitting_modules_mtype_' + mtype;
				var header = createTranslatedElement('header', 'mtype-'+mtype);
				divType.appendChild(header);

				var divRow, divFlex, moduleSize, moduleAbbrev;
				for (var m = 0;  m <= cache.mtypeModules[mtype].length;  m++) {
					var mID = cache.mtypeModules[mtype][m];
					var module = eddb.module[mID];
					var nextSize = ((module || EMPTY_OBJ).class || 0) | 0;
					var nextAbbrev = eddb.mtype[mtype].modulenames[(module || EMPTY_OBJ).name];
					// close the running row when the size class or abbreviation changes (except for shield generators), or if unabbreviated
					if (divRow && (!module || moduleSize !== nextSize || (moduleAbbrev !== nextAbbrev && (typeof moduleAbbrev !== 'string' || mtype !== 'isg')) || !nextAbbrev)) {
						divType.appendChild(divRow);
						divRow = null;
					}
					if (module) {
						moduleSize = nextSize;
						moduleAbbrev = nextAbbrev;
						if (!divRow) {
							divRow = document.createElement('div');
							divRow.id = 'outfitting_modules_mtype_' + mtype + '_size_' + moduleSize;
							var classes = group + ' ' + mtype + ' row sized size' + moduleSize;
							if (cache.mtypeSizeGaps[mtype] && cache.mtypeSizeGaps[mtype][moduleSize]) {
								classes += ' size' + cache.mtypeSizeGaps[mtype][moduleSize].join(' size');
							}
							for (var c = ((mtype === 'cls' || mtype === 'cs' || module.noundersize) ? moduleSize : MAX_SLOT_CLASS);  c >= moduleSize;  c--) {
								classes += ' fitsize' + c;
							}
							divRow.className = classes;
						}
						var label = document.createElement('label');
						label.className = 'togglebutton' + (moduleAbbrev ? ((typeof moduleAbbrev !== 'string') ? '' : ' shortname') : ' fullname');
						label.draggable = true;
						var input = document.createElement('input');
						input.type = 'radio';
						input.id = 'outfitting_module.' + mID + '.';
						input.name = 'module';
						input.value = mID + '.';
						var div = document.createElement('div');
						div.append(createIcon('warning'), getModuleLabelDOM(module, true, true));
						label.appendChild(input);
						label.appendChild(div);
						label.htmlFor = input.id;
						label.addEventListener('touchstart', onUIModulePickerLabelTouchStart);
						divRow.appendChild(label);
						typeSizeMin = min(typeSizeMin, moduleSize);
						typeSizeMax = max(typeSizeMax, moduleSize);
					}
				}
				var classes = group + ' ' + mtype + ' mtype sized';
				for (var c = typeSizeMin;  c <= MAX_SLOT_CLASS;  c++) {
					classes += ' fitsize' + c + ((c <= typeSizeMax) ? (' size' + c) : '');
				}
				divType.className = classes;
				divGroup.appendChild(divType);
			}
			divPicker.appendChild(divGroup);
		}
		document.getElementById('outfitting_modules_container').appendChild(divPicker);
	}; // initUIModulePicker()


	var updateUIModulePickerStoredModules = function() {
		// clear all group/mtype stored flags
		for (var group in cache.groupMtypes) {
			var divGroup = document.getElementById('outfitting_modules_group_' + group);
			if (divGroup)
				divGroup.classList.remove('stored');
			for (var m = 0;  m < cache.groupMtypes[group].length;  m++) {
				var divType = document.getElementById('outfitting_modules_mtype_' + cache.groupMtypes[group][m]);
				if (divType)
					divType.classList.remove('stored');
			}
		}

		// update all stored module picker buttons that previously or currently exist
		var nameNamehash = current.pickerNameNamehash;
		current.pickerNameNamehash = {};
		for (var namehash in current.stored.moduleNamehashStored[0]) {
			nameNamehash[current.stored.moduleNamehashStored[0][namehash].name] = namehash;
		}
		var names = Object.keys(nameNamehash);
		names.sort();
		for (var n = 0;  n < names.length;  n++) {
			updateUIModulePickerStoredModule(nameNamehash[names[n]], true);
		}

		return true;
	}; // updateUIModulePickerStoredModules()


	var updateUIModulePickerStoredModule = function(namehash, sorted) {
		if (!namehash)
			return false;
		var stored = current.stored.moduleNamehashStored[0][namehash];
		var divRow = document.getElementById('outfitting_modules_stored.' + namehash);
		if (stored) {
			current.pickerNameNamehash[stored.name] = namehash;
			var module = eddb.module[stored.modid];
			var mtypeid = module.mtype;
			var szcls = module.class;
			var divType = document.getElementById('outfitting_modules_mtype_' + mtypeid);
			if (!divRow) {
				divRow = document.createElement('div');
				divRow.id = 'outfitting_modules_stored.' + namehash;
				var classes = mtypeid + ' row stored sized size' + szcls;
				if (cache.mtypeSizeGaps[mtypeid] && cache.mtypeSizeGaps[mtypeid][szcls]) {
					classes += ' size' + cache.mtypeSizeGaps[mtypeid][szcls].join(' size');
				}
				for (var c = ((mtypeid === 'cls' || mtypeid === 'cs' || module.noundersize) ? szcls : MAX_SLOT_CLASS);  c >= szcls;  c--) {
					classes += ' fitsize' + c;
				}
				if (stored.name.startsWith(" ")) {
					classes += ' builtin';
				}
				if (stored.engineer) {
					classes += ' engineer';
				}
				divRow.className = classes;
				var label = document.createElement('label');
				label.className = 'togglebutton fullname';
				label.draggable = true;
				var input = document.createElement('input');
				input.type = 'radio';
				input.id = 'outfitting_module.' + stored.modid + '.' + namehash;
				input.name = 'module';
				input.value = stored.modid + '.' + namehash;
				var div = document.createElement('div');
				div.innerHTML = encodeHTML(stored.name); // TODO translated builtin stored module names
				if (module.tag) div.prepend(createIcon(ICON_TAG[module.tag]));
				if (stored.tag) div.prepend(createIcon(ICON_TAG[stored.tag]));
				if (module.tag || stored.tag) div.prepend(' ');
				div.prepend(createIcon('engineer'));
				div.prepend(createIcon('warning'));
				label.appendChild(input);
				label.appendChild(div);
				label.htmlFor = input.id;
				label.addEventListener('touchstart', onUIModulePickerLabelTouchStart);
				divRow.appendChild(label);
				divType.appendChild(divRow);
			} else if (sorted) {
				divType.appendChild(divRow);
			}
			divType.classList.add('stored');
			divType.parentNode.classList.add('stored'); // divGroup
		} else {
			if (divRow)
				divRow.parentNode.removeChild(divRow);
		}
		return true;
	}; // updateUIModulePickerStoredModule()


	var updateUIModulePickerWarnings = function() {
		if (!current.fit)
			return;
		var shipid = current.fit.getShipID();
		var ship = eddb.ship[shipid];

		// get attributes
		var slot = current.fit.getSlot('ship', 'hull');
		var crew = slot.getEffectiveAttrValue('crew');
		var mass = slot.getEffectiveAttrValue('mass');
		var boostcost = slot.getEffectiveAttrValue('boostcost');
		var pwrdraw_ret = current.fit.getStat('pwrdraw_ret');
		var pwrbst = current.fit.getStat('pwrbst') / 100.0;

		// mark hidden modules, but only stock versions (stored/builtin/preeng need to still show up for i.e. the CG anti-corrosion cargo racks)
		for (var m = 0;  m < cache.hiddenmods.length;  m++) {
			var modid = cache.hiddenmods[m];
			var namehashes = Object.keys(/* current.stored.moduleNamehashStored[modid] || */ EMPTY_OBJ);
			namehashes.push('');
			for (var n = 0;  n < namehashes.length;  n++) {
				var namehash = namehashes[n];
				var module = current.fit.getModule(modid);
				var el = document.getElementById('outfitting_module.' + modid + '.' + namehash);
				el.classList.toggle('hidden', !!module.hidden);
			}
		}

		// mark disallowed modules
		for (var m = 0;  m < cache.reservedmods.length;  m++) {
			var modid = cache.reservedmods[m];
			var module = current.fit.getModule(modid);
			var notallowed = (module.reserved && !module.reserved[shipid]);
			var namehashes = Object.keys(current.stored.moduleNamehashStored[modid] || EMPTY_OBJ);
			namehashes.push('');
			for (var n = 0;  n < namehashes.length;  n++) {
				var namehash = namehashes[n];
				var el = document.getElementById('outfitting_module.' + modid + '.' + namehash);
				el.classList.toggle('notallowed', !!notallowed);
			}
		}

		// mark undersized modules
		for (var mtype in { cpp:1, ct:1, cpd:1, isg:1 }) {
			for (var m = 0;  m < cache.mtypeModules[mtype].length;  m++) {
				var modid = cache.mtypeModules[mtype][m];
				var namehashes = Object.keys(current.stored.moduleNamehashStored[modid] || EMPTY_OBJ);
				namehashes.push('');
				for (var n = 0;  n < namehashes.length;  n++) {
					var namehash = namehashes[n];
					if (namehash) {
						current.tempSlot.setStoredHash(current.stored.moduleNamehashStored[0][namehash].modulehash);
					} else {
						current.tempSlot.setModuleID(modid);
					}
					var notenough = false;
					switch (mtype) {
					case 'cpp':
						notenough = ((current.tempSlot.getEffectiveAttrValue('pwrcap') * (1 + pwrbst)) < pwrdraw_ret[0]);
						break;

					case 'ct':
						notenough = (current.tempSlot.getEffectiveAttrValue('engmaxmass') < mass);
						break;

					case 'cpd':
						notenough = (current.tempSlot.getEffectiveAttrValue('engcap') < (boostcost + BOOST_MARGIN));
						break;

					case 'isg':
						notenough = (current.tempSlot.getEffectiveAttrValue('genmaxmass') < mass);
						break;
					}
					var el = document.getElementById('outfitting_module.' + modid + '.' + namehash);
					el.classList.toggle('notenough', !!notenough);
				}
			}
		}
	}; // updateUIModulePickerWarnings()


	var setUIModuleTab = function(tab) {
		current.tab = tab;
		document.forms.modules.elements.tab.value = tab;
		document.forms.modules.className = tab;
	}; // setUIModuleTab()


	var setUIPickerModule = function(modid, namehash, scroll) {
		if (isNaN(modid)) {
			var tokens = document.forms.modules.elements.module.value.split('.');
			modid = tokens[0];
			namehash = tokens[1];
			var input = document.getElementById('outfitting_module.' + modid + '.' + namehash);
			if (input)
				input.checked = false;
			current.pickerSlot.setModuleID(0);
		} else {
			var input = document.getElementById('outfitting_module.' + modid + '.' + namehash);
			if (input) {
				input.checked = true;
			}
			if (namehash) {
				current.pickerSlot.setStoredHash(current.stored.moduleNamehashStored[0][namehash].modulehash);
			} else {
				current.pickerSlot.setModuleID(modid);
			}
			if (scroll) {
				var container = document.getElementById('outfitting_modules_container');
				var label = input;
				while (label && label.tagName !== 'LABEL')
					label = label.parentNode;
				if (container && label && label.offsetParent) {
					var containerR = container.getBoundingClientRect();
					var labelR = label.getBoundingClientRect();
					var margin = (containerR.bottom - containerR.top - labelR.bottom + labelR.top) >> 1;
					container.scrollTop += (min(0, labelR.top - margin - containerR.top) + max(0, labelR.bottom + margin - containerR.bottom));
				}
			}
		}
		return true;
	}; // setUIPickerModule()


	/*
	* BUILD UI
	*/


	var initUIFitSlots = function() {
		var tableLeft = document.createElement('table');
		tableLeft.id = 'slots_table_left';

		var thead = document.createElement('thead');
		thead.appendChild(createUIFitHeaderRow());
		tableLeft.appendChild(thead);

		var tbody = document.createElement('tbody');
		tbody.id = 'outfitting_fit_ship_hull';
		tbody.appendChild(createUIFitSlotRow('ship', 'hull'));
		tableLeft.appendChild(tbody);

		var tableRight = document.createElement('table');
		tableRight.id = 'slots_table_right';

		var thead = document.createElement('thead');
		thead.appendChild(createUIFitHeaderRow());
		tableRight.appendChild(thead);

		var tbody = document.createElement('tbody');
		tbody.id = 'outfitting_fit_ship_hatch';
		tbody.appendChild(createUIFitSlotRow('ship', 'hatch'));
		tableRight.appendChild(tbody);

		for (var g = 0;  g < GROUPS.length;  g++) {
			var slotgroup = GROUPS[g];
			var tbody = document.createElement('tbody');
			tbody.id = 'outfitting_fit_' + slotgroup;
			tbody.appendChild(createUIFitHeaderRow(slotgroup));
			((slotgroup === 'hardpoint' || slotgroup === 'component') ? tableLeft : tableRight).appendChild(tbody);
		}

		document.getElementById('slots_column_left').appendChild(tableLeft);
		document.getElementById('slots_column_right').appendChild(tableRight);
	}; // initUIFitSlots()


	var createUIFitHeaderRow = function(group) {
		var tr = document.createElement('tr');
		if (group) {
			var th = document.createElement('th');
			th.className = 'outfitting_fit_class';
			tr.appendChild(th);

			var th = document.createElement('th');
			th.className = 'outfitting_fit_module';
			var div = document.createElement('div');
			var span = createTranslatedElement('span', 'ui-slotgroup-'+group);
			div.appendChild(span);
			th.appendChild(div);
			tr.appendChild(th);

			var th = document.createElement('th');
			th.className = 'outfitting_fit_mass';
			tr.appendChild(th);

			var th = document.createElement('th');
			th.className = 'outfitting_fit_pwrdraw';
			tr.appendChild(th);

			var th = document.createElement('th');
			th.className = 'outfitting_fit_attrs';
			if (group === 'hardpoint') {
				var attrs = ['dps','sdps','eps','seps','hps','shps','maximumrng','ammoclip'];
				for (var i = 0;  i < 2;  i++) {
					var select = document.createElement('select');
					select.name = 'hardpoint_attr' + (i + 1);
					for (var a = 0;  a < attrs.length;  a++) {
						var option = createTranslatedElement('option', 'attr-'+attrs[a]+'-abbr');
						option.value = attrs[a];
						select.appendChild(option);
					}
					select.selectedIndex = i * 6; // dps,maximumrng
					th.appendChild(select);
				}
			}
			tr.appendChild(th);

			var th = document.createElement('th');
			th.className = 'outfitting_fit_price';
			tr.appendChild(th);
		} else {
			var th = document.createElement('th');
			th.className = 'outfitting_fit_class';
			var abbr = createTranslatedElement('abbr', 'ui-slots-class-abbr');
			abbr.setAttribute('edsy-title', 'ui-slots-class-desc');
			abbr.title = 'Slot size class';
			th.appendChild(abbr);
			tr.appendChild(th);

			var th = document.createElement('th');
			th.className = 'outfitting_fit_module';
			var div = createTranslatedElement('div', 'ui-slots-module-abbr');
			th.appendChild(div);
			tr.appendChild(th);

			var th = document.createElement('th');
			th.className = 'outfitting_fit_mass';
			var abbr = createTranslatedElement('abbr', 'ui-slots-mass-abbr');
			abbr.setAttribute('edsy-title', 'ui-slots-mass-desc');
			abbr.title = 'Hull or module mass (in tons)';
			th.appendChild(abbr);
			tr.appendChild(th);

			var th = document.createElement('th');
			th.className = 'outfitting_fit_pwrdraw';
			var abbr = createTranslatedElement('abbr', 'ui-slots-power-abbr');
			abbr.setAttribute('edsy-title', 'ui-slots-power-desc');
			abbr.title = 'Module power output or draw (in megawatts), powered status, and power priority group';
			th.appendChild(abbr);
			tr.appendChild(th);

			var th = document.createElement('th');
			th.className = 'outfitting_fit_attrs';
			var abbr = createTranslatedElement('abbr', 'ui-slots-attributes-abbr');
			abbr.setAttribute('edsy-title', 'ui-slots-attributes-desc');
			abbr.title = 'Important attributes of each module type';
			th.appendChild(abbr);
			tr.appendChild(th);

			var th = document.createElement('th');
			th.className = 'outfitting_fit_price';
			var abbr = createTranslatedElement('abbr', 'ui-slots-price-abbr');
			abbr.setAttribute('edsy-title', 'ui-slots-price-desc');
			abbr.title = 'Hull or module price (in credits); for hulls, this excludes all stock modules';
			th.appendChild(abbr);
			tr.appendChild(th);
		}
		return tr;
	}; // createUIFitHeaderRow()


	var createUIFitSlotRow = function(group, slot) {
		var group_slot = group + '_' + slot;
		var tr = document.createElement('tr');
		tr.id = 'outfitting_fit_slot_' + group_slot;

		var td = document.createElement('td');
		td.className = 'outfitting_fit_class';
		td.id = 'outfitting_fit_class_' + group_slot;
		tr.appendChild(td);

		var td = document.createElement('td');
		td.id = 'outfitting_fit_module_' + group_slot;
		td.className = 'outfitting_fit_module'; // dynamic 'notallowed', 'notenough', 'overlimit'
		var label = document.createElement('label');
		label.className = 'togglebutton';
		label.draggable = true;
		var input = document.createElement('input');
		input.type = 'radio';
		input.id = 'outfitting_slot.' + group + '.' + slot;
		input.name = 'slot';
		input.value = group_slot;
		var div = document.createElement('div');
		div.appendChild(createIcon('warning')); // dynamically hidden
		var span = document.createElement('span');
		span.id = 'outfitting_fit_name_' + group_slot;
		div.appendChild(span);
		label.appendChild(input);
		label.appendChild(div);
		label.htmlFor = input.id;
		label.addEventListener('touchstart', onUIFitSlotsTouchStart);
		td.appendChild(label);
		tr.appendChild(td);

		var td = document.createElement('td');
		td.className = 'outfitting_fit_mass';
		var span = document.createElement('span');
		span.id = 'outfitting_fit_mass_' + group_slot;
		span.className = ''; // modgood/modbad
		td.appendChild(span);
		tr.appendChild(td);

		var td = document.createElement('td');
		td.className = 'outfitting_fit_pwrdraw';
		td.id = 'outfitting_fit_power_' + group_slot;
		td.className = ''; // priority#
		var label = document.createElement('label');
		label.className = 'checkbox';
		var input = document.createElement('input');
		input.type = 'checkbox';
		input.id = 'outfitting_fit_powered_' + group_slot;
		input.name = 'powered_' + group_slot;
		input.value = 1;
		input.checked = true;
		label.appendChild(input);
		var div = document.createElement('div');
		var span = document.createElement('span');
		span.className = 'outfitting_fit_pwrdraw';
		var span2 = document.createElement('span');
		span2.id = 'outfitting_fit_pwrdraw_' + group_slot;
		span2.className = ''; // modgood/modbad
		span.appendChild(span2);
		div.appendChild(span);
		div.appendChild(document.createTextNode(' '));
		var divCheck = document.createElement('div');
		divCheck.className = 'check';
		div.appendChild(divCheck);
		label.appendChild(div);
		td.appendChild(label);
		var button = document.createElement('button');
		button.id = 'outfitting_fit_priority_' + group_slot;
		button.name = 'priority_' + group_slot;
		button.className = 'outfitting_fit_priority';
		button.innerHTML = formatNumHTML(0);
		td.appendChild(button);
		tr.appendChild(td);

		var td = document.createElement('td');
		td.id = 'outfitting_fit_attrs_' + group_slot;
		td.className = 'outfitting_fit_attrs';
		tr.appendChild(td);

		var td = document.createElement('td');
		td.id = 'outfitting_fit_price_' + group_slot;
		td.className = 'outfitting_fit_price';
		tr.appendChild(td);

		return tr;
	}; // createUIFitSlotRow()


	var updateUIFitColumns = function() {
		document.getElementById('outfitting_fit').className = (
			(document.forms.fit.elements.outfitting_show_mass.checked ? '' : 'no') + 'mass ' +
			(document.forms.fit.elements.outfitting_show_power.checked ? '' : 'no') + 'power ' +
			(document.forms.fit.elements.outfitting_show_attrs.checked ? '' : 'no') + 'attrs ' +
			(document.forms.fit.elements.outfitting_show_price.checked ? '' : 'no') + 'price'
		);
	}; // updateUIFitColumns()


	var updateUIFitTitle = function() {
		var fit = current.fit;
		var hullname = (getTranslation('ship-'+fit.getShipID()) || eddb.ship[fit.getShipID()].name).trim();
		var shipname = (fit.getName() || "").trim();
		var shipnametag = (fit.getNameTag() || "").trim();
		var storedname = hashDecodeS(document.forms.fit.elements.outfitting_fit_stored.value);
		var title = hullname + (shipnametag ? (" " + shipnametag) : "") + (shipname ? (" \"" + shipname + "\"") : "");
		if (storedname)
			title = storedname + " (" + title + ")";
		document.title = "EDSY" + (title ? (": " + title) : "");
		return true;
	}; // updateUIFitTitle()


	var updateUIFitHash = function(buildhash) {
		updateUIFitTitle();
		return true;
	}; // updateUIFitHash()


	var setCurrentFit = function(fit, namehash) {
		if (!fit || !(fit instanceof Build))
			return false;
		current.fit = fit;
		current.pickerSlot = fit.getDetachedSlot();
		current.tempSlot = fit.getDetachedSlot();

		setUIPickerModule();
		updateUIFitStoredBuilds();
		updateUIFitStoredBuildControls(true, namehash);
		document.forms.fit.elements.shipname.value = fit.getName();
		document.forms.fit.elements.shipnametag.value = fit.getNameTag();
		var inaraURL = fit.getInaraBuildURL();
		document.getElementById('fit_header_export').style.display = (inaraURL ? '' : 'none');
		document.forms.fit.elements.export_inara.style.display = (inaraURL ? '' : 'none');
		updateUIFitPowerDist();
		updateUIFitShip();
		updateUIFitSlot('ship', 'hull');
		updateUIFitSlot('ship', 'hatch');
		for (var sg = 0;  sg < GROUPS.length;  sg++) {
			var slotgroup = GROUPS[sg];
			for (var slotnum = 0;  fit.getSlot(slotgroup, slotnum);  slotnum++) {
				updateUIFitSlot(slotgroup, slotnum);
			}
		}
		updateUIFitLimitedSlots();
		document.forms.stats.elements.stats_cur_fuel.value = formatNumText(fit.getStat('fuelcap'), 0);
		document.forms.stats.elements.stats_cur_cargo.value = '0';
		updateUIStats();
		setCurrentSlot('ship', 'hull');
		return true;
	}; // setCurrentFit()


	var setCurrentFitHash = function(buildhash, namehash) {
		var errors = [];
		var build = Build.fromHash(buildhash, errors);
		var ok = (build && setCurrentFit(build, namehash));
		if (!ok || errors.length > 0) {
			// TODO: pretty popup
			alert(
				getTranslation(ok ? 'message-hash-errors' : 'message-hash-invalid') +
				((errors.length > 0) ? ('\n\n* ' + errors.join('\n* ')) : '')
			);
		}
		return ok;
	}; // setCurrentFitHash()


	var setCurrentFitNameHash = function(namehash) {
		var ok = false;
		if (namehash) {
			var stored = current.stored.shipNamehashStored[0][namehash];
			if (!stored)
				return false;
			current.hashlock = true;
			ok = setCurrentFitHash(stored.buildhash, namehash);
			current.hashlock = false;
			if (ok)
				updateUIFitHash(stored.buildhash);
		} else {
			var shipid = (current.fit ? current.fit.getShipID() : 1);
			ok = setCurrentFit(new Build(shipid, true), '');
		}
		return ok;
	}; // setCurrentFitNameHash()


	var processURLHash = function(location, hashlock) {
		var urlhash = location.hash;
		var msieURLtrunc = (location.href.length == 2083 || location.pathname.length == 2048);
		var blocks = urlhash.split('/');
		if (blocks[0] !== '#')
			return false;
		for (var b = 1;  b < blocks.length;  b++) {
			switch (blocks[b].slice(0,2)) {
			case 'L=':
				if (hashlock)
					current.hashlock = true;
				var ok = setCurrentFitHash(blocks[b].slice(2));
				if (hashlock)
					current.hashlock = false;
				if (ok)
					setUIPageTab('outfitting');
				return ok;

			case 'I=':
				return importData(blocks[b].slice(2), msieURLtrunc);
			}
		}
	}; // processURLHash()


	var readStoredOptions = function() {
		if (!cache.feature.storage)
			return false;

		try {
			var item = 'edsy_options' + (current.beta ? '_beta' : '');
			var data = JSON.parse(window.localStorage.getItem(item) || '{}');
			for (var opt in current.option) {
				if (data[opt] !== undefined)
					current.option[opt] = data[opt];
			}
		} catch (exc) {
			console.log(exc);
			return false;
		}
		return true;
	}; // readStoredOptions()


	var writeStoredOptions = function() {
		if (!cache.feature.storage)
			return false;

		var data = JSON.stringify(current.option);
		var item = 'edsy_options' + (current.beta ? '_beta' : '');
		window.localStorage.setItem(item, data);
		return true;
	}; // writeStoredOptions()


	var readStoredBuilds = function(overrideLive) {
		current.stored.shipNamehashStored = { 0:{} };
		current.stored.shipStoreds = { 0:[] };

		if (!cache.feature.storage)
			return false;

		var item = 'edsy_loadouts' + (current.beta ? '_beta' : '');
		var data = (window.localStorage.getItem(item) || '').split('/');
		if (current.beta && overrideLive) {
			data = data.concat((window.localStorage.getItem('edsy_loadouts') || '').split('/'));
		}
		for (var i = 0;  i < data.length;  i++) {
			var entry = data[i].split('=');
			if (entry.length === 2) {
				var namehash = entry[0];
				var buildhash = entry[1];
				var shipid = Build.getHashShipID(buildhash);
				var stored = {
					shipid:shipid,
					namehash:namehash,
					name:hashDecodeS(namehash),
					buildhash:buildhash
				};
				current.stored.shipNamehashStored[0][namehash] = stored;
			}
		}
		for (var namehash in current.stored.shipNamehashStored[0]) {
			var stored = current.stored.shipNamehashStored[0][namehash];
			if (!current.stored.shipNamehashStored[stored.shipid])
				current.stored.shipNamehashStored[stored.shipid] = {};
			current.stored.shipNamehashStored[stored.shipid][namehash] = stored;
		}
		for (var shipid in current.stored.shipNamehashStored) {
			current.stored.shipStoreds[shipid] = Object.values(current.stored.shipNamehashStored[shipid]);
			current.stored.shipStoreds[shipid].sort(sortStoreds);
		}

		return true;
	}; // readStoredBuilds()


	var writeStoredBuilds = function() {
		if (!cache.feature.storage)
			return false;

		var data = [];
		for (var namehash in current.stored.shipNamehashStored[0]) {
			data.push(namehash + '=' + current.stored.shipNamehashStored[0][namehash].buildhash);
		}
		var item = 'edsy_loadouts' + (current.beta ? '_beta' : '');
		window.localStorage.setItem(item, data.join('/'));
		return true;
	}; // writeStoredBuilds()


	var setStoredImport = function(importhash, namehash) {
		var namehashOld = current.importLabel[importhash];
		if (namehashOld) {
			delete current.labelImports[namehashOld][importhash];
			var empty = true;
			for (var importhashOld in current.labelImports[namehashOld]) {
				empty = false;
				break;
			}
			if (empty)
				delete current.labelImports[namehashOld];
		}
		current.importLabel[importhash] = namehash;
		if (!current.labelImports[namehash])
			current.labelImports[namehash] = {};
		current.labelImports[namehash][importhash] = true;
		return true;
	}; // setStoredImport()


	var readStoredImports = function() {
		current.importLabel = {};
		current.labelImports = {};

		if (!cache.feature.storage)
			return false;

		var item = 'edsy_imports' + (current.beta ? '_beta' : '');
		var data = (window.localStorage.getItem(item) || '').split('/');
		for (var i = 0;  i < data.length;  i++) {
			var entry = data[i].split('=');
			if (entry.length === 2) {
				var importhash = entry[0];
				var namehash = entry[1];
				// importhashes from 3.4.2.3 were corrupted by uppercasing; ignore them
				var tag = importhash.slice(0,3);
				if (tag !== tag.toUpperCase()) {
					setStoredImport(importhash, namehash);
				}
			}
		}
		return true;
	}; // readStoredImports()


	var writeStoredImports = function() {
		if (!cache.feature.storage)
			return false;

		var data = [];
		for (var importhash in current.importLabel) {
			data.push(importhash + '=' + current.importLabel[importhash]);
		}
		var item = 'edsy_imports' + (current.beta ? '_beta' : '');
		window.localStorage.setItem(item, data.join('/'));
		return true;
	}; // writeStoredImports()


	var updateUIFitStoredBuilds = function() {
		var select = document.forms.fit.elements.outfitting_fit_stored;
		var shipid = (current.fit ? current.fit.getShipID() : -1);
		var ok = populateDOMSelectStoreds(select, current.stored.shipStoreds[shipid], select.value, 1);
		updateUIFitTitle();
		return ok;
	}; // updateUIFitStoredBuilds()


	var updateUIFitStoredBuildControls = function(setfit, namehash) {
		var select = document.forms.fit.elements.outfitting_fit_stored;
		if (setfit) {
			if (namehash === undefined) {
				select.selectedIndex = -1;
			} else {
				select.value = namehash;
			}
		} else {
			if (select.selectedIndex === 0)
				select.selectedIndex = -1;
		}
		namehash = select.value;
		var storedbuild = (namehash && current.stored.shipNamehashStored[0][namehash]);
		document.getElementById('outfitting_fit_stored_reload').disabled = (setfit || !storedbuild);
		document.getElementById('outfitting_fit_stored_save').disabled = (setfit || !storedbuild);
		document.getElementById('outfitting_fit_stored_saveas').disabled = false;
		document.getElementById('outfitting_fit_stored_rename').disabled = (!storedbuild);
		document.getElementById('outfitting_fit_stored_delete').disabled = (!storedbuild);
		updateUIFitTitle();
		return true;
	}; // updateUIFitStoredBuildControls()


	var saveCurrentStoredBuild = function(saveas) {
		if (!current.fit)
			return false;
		var select = document.forms.fit.elements.outfitting_fit_stored;
		var namehash = select.value;
		var oldnamehash = namehash;
		if (saveas || !namehash) {
			var name = hashDecodeS(namehash) || eddb.ship[current.fit.getShipID()].name;
			do {
				name = prompt(getTranslation('message-build-save'), name);
				if (name === null)
					return false;
				name = (name || '').trim();
				namehash = hashEncodeS(name);
			} while (!name || (current.stored.shipNamehashStored[0][namehash] && !confirm(getTranslation('interp-build-name-overwrite', {'name':name}))));
		}
		var buildhash = current.fit.getHash();
		var shipid = current.fit.getShipID();
		var stored = {
			shipid:shipid,
			namehash:namehash,
			name:hashDecodeS(namehash),
			buildhash:buildhash
		};
		if (!current.stored.shipNamehashStored[shipid])
			current.stored.shipNamehashStored[shipid] = {};
		current.stored.shipNamehashStored[0][namehash] = current.stored.shipNamehashStored[shipid][namehash] = stored;
		current.stored.shipStoreds[0] = Object.values(current.stored.shipNamehashStored[0]);
		current.stored.shipStoreds[0].sort(sortStoreds);
		current.stored.shipStoreds[shipid] = Object.values(current.stored.shipNamehashStored[shipid]);
		current.stored.shipStoreds[shipid].sort(sortStoreds);
		writeStoredBuilds();
		updateUIShipyardStoredBuild(namehash, current.fit);
		if (namehash !== oldnamehash) {
			updateUIFitStoredBuilds();
		}
		updateUIFitStoredBuildControls(true, namehash);
	}; // saveCurrentStoredBuild()


	var renameStoredBuild = function(namehash) {
		var stored = current.stored.shipNamehashStored[0][namehash];
		if (!namehash || !stored)
			return false;
		var oldnamehash = namehash;
		var name = stored.name;
		do {
			name = prompt(getTranslation('message-build-rename'), name);
			if (name === null)
				return false;
			name = (name || '').trim();
			namehash = hashEncodeS(name);
			if (namehash === oldnamehash)
				return false;
		} while (!name || (current.stored.shipNamehashStored[0][namehash] && !confirm(getTranslation('interp-build-name-overwrite', {'name':name}))));
		stored.namehash = namehash;
		stored.name = name;
		current.stored.shipNamehashStored[0][namehash] = current.stored.shipNamehashStored[stored.shipid][namehash] = stored;
		delete current.stored.shipNamehashStored[0][oldnamehash];
		delete current.stored.shipNamehashStored[stored.shipid][oldnamehash];
		current.stored.shipStoreds[0] = Object.values(current.stored.shipNamehashStored[0]);
		current.stored.shipStoreds[0].sort(sortStoreds);
		current.stored.shipStoreds[stored.shipid] = Object.values(current.stored.shipNamehashStored[stored.shipid]);
		current.stored.shipStoreds[stored.shipid].sort(sortStoreds);
		writeStoredBuilds();
		updateUIShipyardStoredBuild(oldnamehash);
		updateUIShipyardStoredBuild(namehash);
		updateUIFitStoredBuilds();
		var select = document.forms.fit.elements.outfitting_fit_stored;
		if (select.value === oldnamehash)
			select.value = namehash;
	}; // renameStoredBuild()


	var deleteStoredBuild = function(namehash) {
		var stored = current.stored.shipNamehashStored[0][namehash];
		if (!namehash || !stored)
			return false;
		var name = stored.name;
		if (!confirm(getTranslation('interp-build-name-delete', {'name':name})))
			return false;
		delete current.stored.shipNamehashStored[0][namehash];
		delete current.stored.shipNamehashStored[stored.shipid][namehash];
		current.stored.shipStoreds[0] = Object.values(current.stored.shipNamehashStored[0]);
		current.stored.shipStoreds[0].sort(sortStoreds);
		current.stored.shipStoreds[stored.shipid] = Object.values(current.stored.shipNamehashStored[stored.shipid]);
		current.stored.shipStoreds[stored.shipid].sort(sortStoreds);
		stored = null;
		writeStoredBuilds();
		updateUIShipyardStoredBuild(namehash);
		updateUIFitStoredBuilds();
		var select = document.forms.fit.elements.outfitting_fit_stored;
		if (select.value === namehash) {
			updateUIFitStoredBuildControls(true);
			select.selectedIndex = -1;
		}
	}; // deleteStoredBuild()


	var updateUIFitShip = function() {
		var shipid = current.fit.getShipID();
		var ship = eddb.ship[shipid];

		// get attributes
		var slot = current.fit.getSlot('ship', 'hull');
		var crew = slot.getEffectiveAttrValue('crew');
		var mass = slot.getEffectiveAttrValue('mass');
		var boostcost = slot.getEffectiveAttrValue('boostcost');

		// update displays
		document.getElementById('outfitting_fit_crewdist_avl').disabled = (crew < 2);
		document.getElementById('outfitting_fit_crewdist_sys').disabled = (crew < 2);
		document.getElementById('outfitting_fit_crewdist_eng').disabled = (crew < 2);
		document.getElementById('outfitting_fit_crewdist_wep').disabled = (crew < 2);
		document.getElementById('outfitting_fit_class_ship_hull').setAttribute('edsy-text', 'size-'+(ship.class || 0)+'-abbr');
		document.getElementById('outfitting_fit_class_ship_hull').innerHTML = '?SML'[ship.class || 0];

		// mark undersized or reserved modules
		updateUIModulePickerWarnings();

		// create or update slot rows
		for (var sg = 0;  sg < GROUPS.length;  sg++) {
			var slotgroup = GROUPS[sg];
			var tbody = document.getElementById('outfitting_fit_' + slotgroup);
			var tr;
			var slotnum = 0;
			while (slotnum < ship.slots[slotgroup].length) {
				var szcls = ship.slots[slotgroup][slotnum];
				if (!(tr = tbody.rows[slotnum + 1])) {
					tbody.appendChild(tr = createUIFitSlotRow(slotgroup, slotnum));
				}
				tr.style.display = '';
				var span = document.createElement('span');
				if (slotgroup === 'hardpoint') {
					span.setAttribute('edsy-text', 'size-'+(szcls || 0)+'-abbr');
					span.setAttribute('edsy-vals', '');
				} else {
					span.setAttribute('edsy-text', 'interp-number');
					span.setAttribute('edsy-vals', (szcls ? JSON.stringify({'number':szcls}) : ''));
				}
				if (((ship.reserved || EMPTY_OBJ)[slotgroup] || EMPTY_OBJ)[slotnum]) {
if(false && current.dev) console.log("updateUIFitShip(): slot "+slotgroup+ "#"+slotnum+" is reserved: "+Object.keys(ship.reserved[slotgroup][slotnum]).join(","));
					var abbr = document.createElement('abbr');
					abbr.setAttribute('edsy-title', 'ui-slots-restricted');
					abbr.appendChild(span);
					abbr.appendChild(document.createTextNode('*'));
					span = abbr;
				}
				document.getElementById('outfitting_fit_class_' + slotgroup + '_' + slotnum).replaceChildren(span);
				slotnum++;
			}
			if (slotnum == 0) {
				tbody.style.display = 'none';
			} else {
				tbody.style.display = '';
				while (tr = tbody.rows[++slotnum]) {
					tr.style.display = 'none';
				}
			}
		}
	}; // updateUIFitShip()


	var updateUIFitDiscounts = function(discounts) {
		var slot;
		for (var sg = 0;  sg < GROUPS.length;  sg++) {
			var slotgroup = GROUPS[sg];
			for (var slotnum = 0;  slot = current.fit.getSlot(slotgroup, slotnum);  slotnum++) {
				slot.setDiscounts(discounts);
			}
		}
		if (current.outfitting_focus === 'slot') {
			updateUIFitStoredBuildControls();
			updateUIFitSlot(current.group, current.slot);
			updateUIStats();
		}
		updateUIDetailsStoredModuleControls();
		updateUIDetailsCost();
		return true;
	}; // updateUIFitDiscounts()


	var updateUIFitPowerDist = function() {
		var maxcrew = (current.fit.getSlot('ship', 'hull').getEffectiveAttrValue('crew') - 1);
		var crew = current.fit.getCrewDist();
		document.getElementById('outfitting_fit_crewdist_avl').className = ('crew' + (maxcrew - crew.sys - crew.eng - crew.wep) + ' max' + maxcrew);
		document.getElementById('outfitting_fit_crewdist_sys').className = ('crew' + crew.sys + ' max' + maxcrew);
		document.getElementById('outfitting_fit_crewdist_eng').className = ('crew' + crew.eng + ' max' + maxcrew);
		document.getElementById('outfitting_fit_crewdist_wep').className = ('crew' + crew.wep + ' max' + maxcrew);
		var dist = current.fit.getEffectivePowerDist();
		document.getElementById('outfitting_fit_powerdist_sys').className = ('crew' + crew.sys + ' dist' + dist.sys);
		document.getElementById('outfitting_fit_powerdist_eng').className = ('crew' + crew.eng + ' dist' + dist.eng);
		document.getElementById('outfitting_fit_powerdist_wep').className = ('crew' + crew.wep + ' dist' + dist.wep);
	}; // updateUIFitPowerDist()


	var emptyUIFitLimitedSlots = function(limit, slotgroup, slotnum) {
		var slot = current.fit.getSlot(slotgroup, slotnum);
		if (!limit)
			limit = slot ? (slot.getModule() || EMPTY_OBJ).limit : null;
		var limitSlots = current.fit.getLimitedSlots();
		if (eddb.limit[limit] && limitSlots[limit] && !current.option.experimental) {
			var limitmax = eddb.limit[limit] + (current.fit.getStat('unlimit')[limit] || 0);
			for (var s = limitSlots[limit].length - 1;  s >= 0 && limitSlots[limit].length > limitmax;  s--) {
				var slotlim = limitSlots[limit][s];
				if (slotlim.getSlotGroup() != slotgroup || slotlim.getSlotNum() != slotnum) {
					if (slotlim.setModuleID(0)) {
						updateUIFitSlot(slotlim.getSlotGroup(), slotlim.getSlotNum());
						limitSlots[limit].splice(s, 1);
					}
				}
			}
		}
		updateUIFitLimitedSlots(limitSlots);
		return true;
	}; // emptyUIFitLimitedSlots()


	var updateUIFitLimitedSlots = function(limitSlots) {
		if (!limitSlots)
			limitSlots = current.fit.getLimitedSlots();
		var slot;
		for (var sg = 0;  sg < GROUPS.length;  sg++) {
			var slotgroup = GROUPS[sg];
			for (var slotnum = 0;  slot = current.fit.getSlot(slotgroup, slotnum);  slotnum++) {
				var limit = (slot.getModule() || EMPTY_OBJ).limit;
				var limitmax = (eddb.limit[limit] || 99) + (current.fit.getStat('unlimit')[limit] || 0);
				document.getElementById('outfitting_fit_module_' + slotgroup + '_' + slotnum).classList.toggle('overlimit', (limitSlots[limit] || EMPTY_ARR).length > limitmax);
			}
		}
	}; // updateUIFitLimitedSlots()


	var updateUIFitSlot = function(slotgroup, slotnum) {
		var group_slot = slotgroup + '_' + slotnum;
		var slot = current.fit.getSlot(slotgroup, slotnum);
		var modid = slot.getModuleID();

		var el = document.getElementById('outfitting_fit_module_' + group_slot);
		el.classList.toggle('notallowed', !slot.isModuleIDAllowed(modid));
		el.classList.toggle('notenough', !slot.isEnough());

		var el = document.getElementById('outfitting_fit_name_' + group_slot);
		if (group_slot === 'ship_hull') {
			el.setAttribute('edsy-text', 'ship-'+modid);
			el.innerText = getTranslation('ship-'+modid);
		} else if (modid) {
			el.replaceChildren(getModuleLabelDOM(slot.getModule(), false, true));
		} else {
			el.replaceChildren();
		}
		if (slot.isModified())
			el.prepend(createIcon('engineer'));

		var value = slot.getEffectiveAttrValue('mass') || 0;
		var direction = getAttrModifierDirection('mass', slot.getEffectiveAttrModifier('mass'));
		document.getElementById('outfitting_fit_mass_' + group_slot).innerHTML = (value ? formatAttrHTML('mass', value) : '');
		document.getElementById('outfitting_fit_mass_' + group_slot).className = (direction > 0 ? 'modgood' : (direction < 0 ? 'modbad' : ''));

		document.getElementById('outfitting_fit_power_' + group_slot).className = 'priority' + slot.getPriority() + ' priority' + slot.getPriority() + ((slotgroup === 'hardpoint' || (slotgroup === 'utility' && !(eddb.module[modid] || EMPTY_OBJ).passive)) ? 'dep' : 'ret') + (slot.getPowerLock() ? ' powerlock' : '');
		var value = slot.getEffectiveAttrValue('pwrdraw') || 0;
		var direction = getAttrModifierDirection('pwrdraw', slot.getEffectiveAttrModifier('pwrdraw'));
		if (value) {
			document.getElementById('outfitting_fit_pwrdraw_' + group_slot).innerHTML = formatAttrHTML('pwrdraw', -value);
			document.getElementById('outfitting_fit_powered_' + group_slot).disabled = !!slot.getPowerLock();
			document.getElementById('outfitting_fit_powered_' + group_slot).checked = slot.getPowered();
			document.getElementById('outfitting_fit_priority_' + group_slot).disabled = !!slot.getPowerLock();
			document.getElementById('outfitting_fit_priority_' + group_slot).innerHTML = slot.getPriority();
		} else {
			var value = slot.getEffectiveAttrValue('pwrcap') || 0;
			var direction = getAttrModifierDirection('pwrcap', slot.getEffectiveAttrModifier('pwrcap'));
			document.getElementById('outfitting_fit_powered_' + group_slot).disabled = true;
			document.getElementById('outfitting_fit_pwrdraw_' + group_slot).innerHTML = (value ? ('+' + formatAttrHTML('pwrcap', value)) : '');
			document.getElementById('outfitting_fit_priority_' + group_slot).disabled = true;
			document.getElementById('outfitting_fit_priority_' + group_slot).innerHTML = '';
		}
		document.getElementById('outfitting_fit_pwrdraw_' + group_slot).className = (direction > 0 ? 'modgood' : (direction < 0 ? 'modbad' : ''));

		var attrs = (group_slot === 'ship_hull') ? ['masslock','crew'] : ((eddb.mtype[(eddb.module[modid] || EMPTY_OBJ).mtype] || EMPTY_OBJ).keyattrs || EMPTY_ARR);
		var hardpoint_attrs = {};
		hardpoint_attrs[document.forms.fit.elements.hardpoint_attr1.value] = true;
		hardpoint_attrs[document.forms.fit.elements.hardpoint_attr2.value] = true;
		var attrhtml = [];
		for (var a = 0;  a < attrs.length;  a++) {
			var attr = attrs[a];
			switch (attr) {
			case 'damage':
				attr = 'dps';
				if (slotgroup === 'hardpoint') {
					if (hardpoint_attrs['sdps']) {
						if (hardpoint_attrs['dps']) {
							var value = slot.getEffectiveAttrValue(attr);
							var direction = getAttrModifierDirection(attr, slot.getEffectiveAttrModifier(attr));
							attrhtml.push(formatAttrLabelHTML(attr) + ' <span class="' + (direction > 0 ? 'modgood' : (direction < 0 ? 'modbad' : '')) + '">' + formatAttrHTML(attr, value) + '</span>');
						}
						attr = 'sdps';
					} else if (!hardpoint_attrs['dps']) {
						attr = null;
					}
				}
				break;

			case 'distdraw':
				if (slotgroup === 'hardpoint') {
					attr = 'eps';
					if (hardpoint_attrs['seps']) {
						if (hardpoint_attrs['eps']) {
							var value = slot.getEffectiveAttrValue(attr);
							var direction = getAttrModifierDirection(attr, slot.getEffectiveAttrModifier(attr));
							attrhtml.push(formatAttrLabelHTML(attr) + ' <span class="' + (direction > 0 ? 'modgood' : (direction < 0 ? 'modbad' : '')) + '">' + formatAttrHTML(attr, value) + '</span>');
						}
						attr = 'seps';
					} else if (!hardpoint_attrs['eps']) {
						attr = null;
					}
				}
				break;

			case 'thmload':
				if (slotgroup === 'hardpoint') {
					attr = 'hps';
					if (hardpoint_attrs['shps']) {
						if (hardpoint_attrs['hps']) {
							var value = slot.getEffectiveAttrValue(attr);
							var direction = getAttrModifierDirection(attr, slot.getEffectiveAttrModifier(attr));
							attrhtml.push(formatAttrLabelHTML(attr) + ' <span class="' + (direction > 0 ? 'modgood' : (direction < 0 ? 'modbad' : '')) + '">' + formatAttrHTML(attr, value) + '</span>');
						}
						attr = 'shps';
					} else if (!hardpoint_attrs['hps']) {
						attr = null;
					}
				}
				break;

			case 'maximumrng':
				if (hardpoint_attrs['maximumrng']) {
					var value = slot.getEffectiveAttrValue(attr);
					var value2 = slot.getEffectiveAttrValue('dmgfall');
					if (value && value2) {
						var direction = getAttrModifierDirection(attr, slot.getEffectiveAttrModifier(attr));
						var direction2 = getAttrModifierDirection('dmgfall', slot.getEffectiveAttrModifier('dmgfall'));
						attrhtml.push(
							formatAttrLabelHTML('dmgfall-maximumrng') +
							' <span class="' + (direction2 > 0 ? 'modgood' : (direction2 < 0 ? 'modbad' : '')) + '">' + formatNumHTML(value2) +
							'</span><small class="semantic">/</small><span class="' + (direction > 0 ? 'modgood' : (direction < 0 ? 'modbad' : '')) + '">' +
							formatAttrHTML(attr, value) + '</span>'
						);
						attr = null;
					} else if (value2) {
						attr = 'dmgfall';
					}
				} else {
					attr = null;
				}
				break;

			case 'ammoclip':
			case 'ammomax':
				attr = null;
				if (slotgroup !== 'hardpoint' || hardpoint_attrs['ammoclip'] || hardpoint_attrs['ammomax']) {
					var value = slot.getEffectiveAttrValue('ammoclip');
					var value2 = slot.getEffectiveAttrValue('ammomax');
					if (value && value2) {
						var direction = getAttrModifierDirection('ammomax', slot.getEffectiveAttrModifier('ammomax'));
						var direction2 = getAttrModifierDirection('ammoclip', slot.getEffectiveAttrModifier('ammoclip'));
						attrhtml.push(
							formatAttrLabelHTML('ammoclip-ammomax') +
							' <span class="' + (direction2 > 0 ? 'modgood' : (direction2 < 0 ? 'modbad' : '')) + '">' + formatNumHTML(value) +
							'</span>+<span class="' + (direction > 0 ? 'modgood' : (direction < 0 ? 'modbad' : '')) + '">' +
							formatAttrHTML('ammomax', value2) + '</span>'
						);
					} else if (value) {
						attr = 'ammoclip';
					} else if (value2) {
						attr = 'ammomax';
					}
				}
				break;

			case 'kinres':
			case 'thmres':
			case 'expres':
				var valueK = slot.getEffectiveAttrValue('kinres');
				var valueT = slot.getEffectiveAttrValue('thmres');
				var valueE = slot.getEffectiveAttrValue('expres');
				var directionK = getAttrModifierDirection('kinres', slot.getEffectiveAttrModifier('kinres'));
				var directionT = getAttrModifierDirection('thmres', slot.getEffectiveAttrModifier('thmres'));
				var directionE = getAttrModifierDirection('expres', slot.getEffectiveAttrModifier('expres'));
				if (valueK || valueT || valueE) {
					attrhtml.push(
						formatAttrLabelHTML('kinres-thmres-expres') +
						' <span class="' + (directionK > 0 ? 'modgood' : (directionK < 0 ? 'modbad' : '')) + '">' + formatNumHTML(valueK, 1) + '</span>' +
						'<small class="semantic">/</small><span class="' + (directionT > 0 ? 'modgood' : (directionT < 0 ? 'modbad' : '')) + '">' + formatNumHTML(valueT, 1) + '</span>' +
						'<small class="semantic">/</small><span class="' + (directionE > 0 ? 'modgood' : (directionE < 0 ? 'modbad' : '')) + '">' + formatNumHTML(valueE, 1) + '</span>' +
						'<small class="semantic">%</small>'
					);
				}
				attr = null;
				break;

			case 'shieldrnfps':
				var value = slot.getEffectiveAttrValue(attr) * slot.getEffectiveAttrValue('scbdur');
				var value2 = slot.getBaseAttrValue(attr) * slot.getBaseAttrValue('scbdur');
				var direction = value - value2;
				if (value) {
					attrhtml.push(formatAttrLabelHTML('shieldrnfps-scbdur') + ' <span class="' + (direction > 0 ? 'modgood' : (direction < 0 ? 'modbad' : '')) + '">' + formatNumHTML(value, 0) + '</span>');
				}
				attr = null;
				break;

			case 'thmdrain':
				var value = slot.getEffectiveAttrValue(attr) * slot.getEffectiveAttrValue('hsdur');
				var value2 = slot.getBaseAttrValue(attr) * slot.getBaseAttrValue('hsdur');
				var direction = value - value2;
				if (value) {
					attrhtml.push(formatAttrLabelHTML('thmdrain-hsdur') + ' <span class="' + (direction > 0 ? 'modgood' : (direction < 0 ? 'modbad' : '')) + '">' + formatNumHTML(value, 0) + '</span>');
				}
				attr = null;
				break;

			case 'afmrepcap':
			case 'lmprepcap':
				var value = slot.getEffectiveAttrValue(attr) * slot.getEffectiveAttrValue('repairrtg');
				var value2 = slot.getBaseAttrValue(attr) * slot.getBaseAttrValue('repairrtg');
				var direction = value - value2;
				if (value) {
					attrhtml.push(formatAttrLabelHTML('repcap-repairrtg') + ' <span class="' + (direction > 0 ? 'modgood' : (direction < 0 ? 'modbad' : '')) + '">' + formatAttrHTML(attr, value) + '</span>');
				}
				attr = null;
				break;

			case 'syscap':
			case 'engcap':
			case 'wepcap':
				var valueS = slot.getEffectiveAttrValue('syscap');
				var valueE = slot.getEffectiveAttrValue('engcap');
				var valueW = slot.getEffectiveAttrValue('wepcap');
				var directionS = getAttrModifierDirection('syscap', slot.getEffectiveAttrModifier('syscap'));
				var directionE = getAttrModifierDirection('engcap', slot.getEffectiveAttrModifier('engcap'));
				var directionW = getAttrModifierDirection('wepcap', slot.getEffectiveAttrModifier('wepcap'));
				if (valueS || valueE || valueW) {
					attrhtml.push(
						formatAttrLabelHTML('syscap-engcap-wepcap') +
						' <span class="' + (directionS > 0 ? 'modgood' : (directionS < 0 ? 'modbad' : '')) + '">' + formatNumHTML(valueS, 0) + '</span>' +
						'<small class="semantic">/</small><span class="' + (directionE > 0 ? 'modgood' : (directionE < 0 ? 'modbad' : '')) + '">' + formatNumHTML(valueE, 0) + '</span>' +
						'<small class="semantic">/</small><span class="' + (directionW > 0 ? 'modgood' : (directionW < 0 ? 'modbad' : '')) + '">' + formatNumHTML(valueW, 0) + '</span>' +
						'<small class="semantic">MW</small>'
					);
					var valueS = slot.getEffectiveAttrValue('syschg');
					var valueE = slot.getEffectiveAttrValue('engchg');
					var valueW = slot.getEffectiveAttrValue('wepchg');
					var directionS = getAttrModifierDirection('syschg', slot.getEffectiveAttrModifier('syschg'));
					var directionE = getAttrModifierDirection('engchg', slot.getEffectiveAttrModifier('engchg'));
					var directionW = getAttrModifierDirection('wepchg', slot.getEffectiveAttrModifier('wepchg'));
					attrhtml.push(
						' +<span class="' + (directionS > 0 ? 'modgood' : (directionS < 0 ? 'modbad' : '')) + '">' + formatNumHTML(valueS, 1) + '</span>' +
						'<small class="semantic">/</small><span class="' + (directionE > 0 ? 'modgood' : (directionE < 0 ? 'modbad' : '')) + '">' + formatNumHTML(valueE, 1) + '</span>' +
						'<small class="semantic">/</small><span class="' + (directionW > 0 ? 'modgood' : (directionW < 0 ? 'modbad' : '')) + '">' + formatNumHTML(valueW, 1) + '</span>' +
						'<small class="semantic">/s</small>'
					);
				}
				attr = null;
				break;

			case 'syschg':
			case 'engchg':
			case 'wepchg':
				attr = null;
				break;
			}
			if (attr) {
				var value = slot.getEffectiveAttrValue(attr);
				if (value) {
					var direction = getAttrModifierDirection(attr, slot.getEffectiveAttrModifier(attr));
					attrhtml.push(formatAttrLabelHTML(attr) + ' <span class="' + (direction > 0 ? 'modgood' : (direction < 0 ? 'modbad' : '')) + '">' + formatAttrHTML(attr, value) + '</span>');
				}
			}
		}
		document.getElementById('outfitting_fit_attrs_' + group_slot).innerHTML = attrhtml.join(' ');

		var el = document.getElementById('outfitting_fit_price_' + group_slot);
		var value = slot.getCost();
		var base = slot.getBaseCost();
		var direction = base - value;
		el.innerHTML = ((base !== undefined) ? formatPriceHTML(value) : '');
		el.classList.toggle('modgood', direction > 0);
		el.classList.toggle('modbad', direction < 0);
		updateTranslations(document.getElementById('outfitting_fit_slot_' + group_slot));
	}; // updateUIFitSlot()


	var setCurrentSlot = function(slotgroup, slotnum) {
		current.group = slotgroup;
		current.slot = slotnum;
		var shipid = current.fit.getShipID();
		var ship = eddb.ship[shipid];
		var reserved = ((ship.reserved || EMPTY_OBJ)[slotgroup] || EMPTY_OBJ)[slotnum];
		setUIOutfittingFocus('slot');
		document.getElementById('outfitting_modules_picker').className = (
			slotgroup +
			((slotgroup === 'component') ? (' component_' + CORE_SLOT_ABBR[slotnum]) : '') +
			((GROUPS.indexOf(slotgroup) >= 0) ? (' size' + ship.slots[slotgroup][slotnum]) : ('_' + slotnum)) +
			(reserved ? ' reserved' : '')
		);
if(false && current.dev) console.log("setCurrentSlot(): slot "+slotgroup+ " #"+slotnum+" is "+(reserved ? ("reserved: "+Object.keys(reserved).join(",")) : "unreserved"));
		for (var mtype in cache.mtypeModules) {
			document.getElementById('outfitting_modules_mtype_' + mtype).classList.toggle('reserved', !!(reserved && reserved[mtype]));
		}

		var slot = current.fit.getSlot(slotgroup, slotnum);

		for (var m = 0;  m < cache.reservedmods.length;  m++) {
			var modid = cache.reservedmods[m];
			var notallowed = !slot.isModuleIDAllowed(modid);
			var namehashes = Object.keys(current.stored.moduleNamehashStored[modid] || EMPTY_OBJ);
			namehashes.push('');
			for (var n = 0;  n < namehashes.length;  n++) {
				var namehash = namehashes[n];
				var el = document.getElementById('outfitting_module.' + modid + '.' + namehash);
				el.classList.toggle('notallowed', !!notallowed);
			}
		}

		var modid = slot.getModuleID();
		if (GROUPS.indexOf(slotgroup) >= 0) {
			var modulehash = slot.getStoredHash();
			var namehash = (current.stored.modulehashStored[modulehash] || EMPTY_OBJ).namehash || '';
			setUIPickerModule(modid, namehash, modid && (current.tab === 'SLOT'));
		} else {
			setUIPickerModule();
		}
		document.forms.fit.elements.slot.value = slotgroup + '_' + slotnum;
		updateUIDetailsStoredModules();
		updateUIDetailsStoredModuleControls(true);
		updateUIDetailsModule();
	}; // setCurrentSlot()


	var setCurrentFitSlotModule = function(slotgroup, slotnum, modid, namehash, storedhash) {
		var slot = current.fit.getSlot(slotgroup, slotnum);
		var module = slot.getModule();
		var limitOld = (module || EMPTY_OBJ).limit;
		var unlimitOld = (module || EMPTY_OBJ).unlimit;
		var ok;
		if (namehash || storedhash) {
			ok = slot.setStoredHash(storedhash || current.stored.moduleNamehashStored[0][namehash].modulehash, null, current.option.experimental);
			modid = slot.getModuleID();
		} else {
			ok = slot.setModuleID(modid, current.option.experimental);
			if (ok)
				slot.setDiscounts(current.option.discounts);
		}
		if (!ok)
			return false;
		module = slot.getModule();
		var limitNew = (module || EMPTY_OBJ).limit;
		var unlimitNew = (module || EMPTY_OBJ).unlimit;
		updateUIFitStoredBuildControls();
		updateUIFitSlot(slotgroup, slotnum);
		if (eddb.limit[limitNew]) {
			emptyUIFitLimitedSlots(limitNew, slotgroup, slotnum);
		}
		if (eddb.limit[unlimitOld]) {
			emptyUIFitLimitedSlots(unlimitOld);
		}
		if (eddb.limit[limitOld] || eddb.limit[unlimitNew]) {
			updateUIFitLimitedSlots();
		}
		updateUIStats();
		setCurrentSlot(slotgroup, slotnum);
		updateUIDetailsStoredModuleControls(true, namehash);
		return true;
	}; // setCurrentFitSlotModule()


	var swapCurrentFitSlotModules = function(slotgroup1, slotnum1, slotgroup2, slotnum2) {
		if (!current.fit.swapSlots(slotgroup1, slotnum1, slotgroup2, slotnum2))
			return false;
		updateUIFitStoredBuildControls();
		updateUIFitSlot(slotgroup1, slotnum1);
		updateUIFitSlot(slotgroup2, slotnum2);
		updateUIFitLimitedSlots();
		// for most modules the stats don't care which slot they're in, but there is one notable exception
		if ((slotgroup1 === 'component' && slotnum1 === CORE_ABBR_SLOT.FT) || (slotgroup2 === 'component' && slotnum2 === CORE_ABBR_SLOT.FT)) {
			// why does it matter which fuel tank is in the 'core' slot? I don't remember :X
			updateUIStats();
		} else {
			updateUIFitHash();
		}
		setCurrentSlot(slotgroup2, slotnum2);
		return true;
	}; // swapCurrentFitSlotModules()


	var copyCurrentFitSlotModule = function(slotgroup1, slotnum1, slotgroup2, slotnum2) {
		var module1 = current.fit.getSlot(slotgroup2, slotnum2).getModule();
		var limitOld = (module1 || EMPTY_OBJ).limit;
		var unlimitOld = (module1 || EMPTY_OBJ).unlimit;
		if (!current.fit.copySlot(slotgroup1, slotnum1, slotgroup2, slotnum2))
			return false;
		var module2 = current.fit.getSlot(slotgroup2, slotnum2).getModule();
		var limitNew = (module2 || EMPTY_OBJ).limit;
		var unlimitNew = (module2 || EMPTY_OBJ).unlimit;
		updateUIFitStoredBuildControls();
		updateUIFitSlot(slotgroup2, slotnum2);
		if (eddb.limit[limitNew]) {
			emptyUIFitLimitedSlots(limitNew, slotgroup2, slotnum2);
		}
		if (eddb.limit[unlimitOld]) {
			emptyUIFitLimitedSlots(unlimitOld);
		}
		if (eddb.limit[limitOld] || eddb.limit[unlimitNew]) {
			updateUIFitLimitedSlots();
		}
		updateUIStats();
		setCurrentSlot(slotgroup2, slotnum2);
		return true;
	}; // copyCurrentFitSlotModule()


	var changeCurrentFitCrewDist = function(to, delta) {
		if (!current.fit.changeCrewDist(to, delta))
			return false;
		updateUIFitStoredBuildControls();
		updateUIFitPowerDist();
		updateUIStats();
		return true;
	}; // changeCurrentFitCrewDist()


	var resetCurrentFitPowerDist = function() {
		var v = TOTAL_POWER_DIST / 3;
		if (!current.fit.setPowerDist(v,v,v))
			return false;
		updateUIFitStoredBuildControls();
		updateUIFitPowerDist();
		updateUIStats();
		return true;
	}; // resetCurrentFitPowerDist()


	var changeCurrentFitPowerDist = function(to, delta) {
		if (!current.fit.changePowerDist(to, delta))
			return false;
		updateUIFitStoredBuildControls();
		updateUIFitPowerDist();
		updateUIStats();
		return true;
	}; // changeCurrentFitPowerDist()


	var setCurrentFitSlotPowered = function(slotgroup, slotnum, powered) {
		if (!current.fit.getSlot(slotgroup, slotnum).setPowered(powered))
			return false;
		updateUIFitStoredBuildControls();
		updateUIFitSlot(slotgroup, slotnum);
		updateUIStats();
		return true;
	}; // setCurrentFitSlotPowered()


	var changeCurrentFitSlotPriority = function(slotgroup, slotnum, delta) {
		if (!current.fit.getSlot(slotgroup, slotnum).changePriority(delta))
			return false;
		updateUIFitStoredBuildControls();
		updateUIFitSlot(slotgroup, slotnum);
		updateUIStats();
		return true;
	}; // changeCurrentFitSlotPriority()


	/*
	* DETAILS UI
	*/


	var initUIDetails = function() {
		var container = document.getElementById('details_cost_discounts');
		while (container.lastElementChild)
			cache.template.details_cost_discounts_label = container.removeChild(container.lastElementChild);
		for (var i = 0;  i <= DISCOUNTS.length;  i++) {
			var bit = min(1 << i, 0x3F);
			var label = cache.template.details_cost_discounts_label.cloneNode(true);
			label.getElementsByTagName('INPUT')[0].value = bit;
			if (bit == 0x3F) {
				label.getElementsByTagName('DIV')[0].setAttribute('edsy-text', 'ui-details-discount-free');
				label.getElementsByTagName('DIV')[0].innerHTML = 'FREE'
			} else {
				label.getElementsByTagName('DIV')[0].innerHTML = formatPctHTML(1 - cache.discountMod[bit], (DISCOUNTS[DISCOUNTS.length - 1 - i] % 1 ? 1 : 0));
			}
			container.appendChild(label);
		}

		var table = document.createElement('table');
		table.id = 'outfitting_details_table';

		var tbody = document.createElement('tbody');
		tbody.id = 'outfitting_details_attrs';
		addUIDetailsAttrRow(tbody);
		table.appendChild(tbody);

		document.getElementById('outfitting_details_module').appendChild(table);
	}; // initUIDetails()


	var addUIDetailsAttrRow = function(tbody) {
		tbody = tbody || document.getElementById('outfitting_details_attrs');
		if (!tbody)
			return false;

		var r = tbody.rows.length;
		var tr = document.createElement('tr');

		var td = document.createElement('td');
		var abbr = document.createElement('abbr');
		abbr.id = 'outfitting_details_abbr_' + r;
		td.appendChild(abbr);
		tr.appendChild(td);

		var td = document.createElement('td');
		var div = document.createElement('div');
		div.className = 'outfitting_details_input';
		var input = document.createElement('input');
		input.id = 'outfitting_details_input_' + r;
		input.type = 'text';
		input.size = 4;
		div.appendChild(input);
		td.appendChild(div);
		tr.appendChild(td);

		var td = document.createElement('td');
		var span = document.createElement('span');
		span.id = 'outfitting_details_unit_' + r;
		span.className = 'outfitting_details_unit';
		td.appendChild(span);
		tr.appendChild(td);

		var td = document.createElement('td');
		var span = document.createElement('span');
		span.id = 'outfitting_details_mod_' + r;
		td.appendChild(span);
		tr.appendChild(td);

		tbody.appendChild(tr);
		return true;
	}; // addUIDetailsAttrRow()


	var readStoredModules = function() {
		current.stored.moduleNamehashStored = { 0:{} };
		current.stored.moduleStoreds = { 0:[] };
		current.stored.modulehashStored = {};

		if (!cache.feature.storage)
			return false;

		// load regular stored modules
		var item = 'edsy_modules' + (current.beta ? '_beta' : '');
		var data = (window.localStorage.getItem(item) || '').split('/');
		for (var i = 0;  i < data.length;  i++) {
			var entry = data[i].split('=');
			if (entry.length === 2) {
				var namehash = entry[0];
				var modulehash = entry[1];
				var modid = Slot.getStoredHashModuleID(modulehash);
				var stored = {
					modid:modid,
					namehash:namehash,
					name:hashDecodeS(namehash),
					modulehash:modulehash,
					engineer:Slot.isStoredHashModified(modulehash),
				};
				current.stored.moduleNamehashStored[0][namehash] = stored;
				current.stored.modulehashStored[stored.modulehash] = stored;
			}
		}

		// populate builtin stored modules (which are specially named with leading spaces)
		if (current.option.builtin !== 'none') {
			for (var bmodid in BUILTIN_STORED_MODULES) {
				var builtin = BUILTIN_STORED_MODULES[bmodid];
				if (current.option.builtin === 'all' || (builtin.tag !== 'C') || current.option['builtin'+bmodid]) {
					var name = " "+builtin.name;
					var namehash = hashEncodeS(name);
					var stored = {
						modid:Slot.getStoredHashModuleID(builtin.modulehash),
						namehash:namehash,
						name:name,
						modulehash:builtin.modulehash,
						engineer:Slot.isStoredHashModified(builtin.modulehash),
						tag:builtin.tag,
					};
					current.stored.moduleNamehashStored[0][namehash] = stored;
					current.stored.modulehashStored[stored.modulehash] = stored;
				}
			}
		}

		for (var namehash in current.stored.moduleNamehashStored[0]) {
			var stored = current.stored.moduleNamehashStored[0][namehash];
			if (!current.stored.moduleNamehashStored[stored.modid])
				current.stored.moduleNamehashStored[stored.modid] = {};
			current.stored.moduleNamehashStored[stored.modid][namehash] = stored;
		}
		for (var modid in current.stored.moduleNamehashStored) {
			current.stored.moduleStoreds[modid] = Object.values(current.stored.moduleNamehashStored[modid]);
			current.stored.moduleStoreds[modid].sort(sortStoreds);
		}

		return true;
	}; // readStoredModules()


	var writeStoredModules = function() {
		if (!cache.feature.storage)
			return false;

		var data = [];
		for (var namehash in current.stored.moduleNamehashStored[0]) {
			// skip builtins
			if (!hashDecodeS(namehash).startsWith(" "))
				data.push(namehash + '=' + current.stored.moduleNamehashStored[0][namehash].modulehash);
		}
		var item = 'edsy_modules' + (current.beta ? '_beta' : '');
		window.localStorage.setItem(item, data.join('/'));
		return true;
	}; // writeStoredModules()


	var updateUIDetailsStoredModules = function() {
		var select = document.forms.details.elements.outfitting_details_stored;

		if (current.outfitting_focus === 'module') {
			var tokens = document.forms.modules.elements.module.value.split('.');
			var namehash = tokens[1];
			if (namehash) {
				setDOMSelectLength(select, 2);
				select.options[1].value = namehash;
				select.options[1].text = hashDecodeS(namehash);
				select.selectedIndex = 1;
			} else {
				setDOMSelectLength(select, 1);
				select.selectedIndex = 0;
			}
		} else if (current.outfitting_focus === 'slot') {
			var slot = current.fit.getSlot(current.group, current.slot);
			var modid = slot.getModuleID();
			if (current.group === 'ship') {
				setDOMSelectLength(select, 1);
				select.selectedIndex = 0;
			} else if (modid) {
				var namehash = select.value;
				select.selectedIndex = ((slot.getStoredHash() === cache.moduleHash[modid]) ? 0 : -1);
				populateDOMSelectStoreds(select, current.stored.moduleStoreds[modid], namehash, 1);
			}
		} else {
			return false;
		}

		return true;
	}; // updateUIDetailsStoredModules()


	var updateUIDetailsStoredModuleControls = function(setmodule, namehash) {
		var select = document.forms.details.elements.outfitting_details_stored;
		var slot = getUIOutfittingSlot();
		if (!slot)
			return false;
		var modid = slot.getModuleID();
		var modulehash = slot.getStoredHash();
		var stockhash = cache.moduleHash[modid] || '';
		if (setmodule) {
			if (!namehash && modid && modulehash !== stockhash) {
				for (var nh in (current.stored.moduleNamehashStored[modid] || EMPTY_OBJ)) {
					if (current.stored.moduleNamehashStored[modid][nh].modulehash === modulehash) {
						namehash = nh;
						break;
					}
				}
			}
			select.value = namehash || '';
		}
		if (select.selectedIndex <= 0) {
			select.selectedIndex = ((modid && modulehash === stockhash) ? 0 : -1);
		}
		namehash = select.value || '';
		var storedhash = (namehash ? current.stored.moduleNamehashStored[0][namehash].modulehash : stockhash);
		var builtin = hashDecodeS(namehash).startsWith(" ");

		select.disabled = (current.outfitting_focus === 'module' || current.group === 'ship' || !modid);
		document.getElementById('outfitting_details_stored_reload').disabled = (!namehash || modulehash === storedhash);
		document.getElementById('outfitting_details_stored_save').disabled = (!namehash || modulehash === storedhash || builtin)
		document.getElementById('outfitting_details_stored_saveas').disabled = (!modulehash || (current.outfitting_focus === 'slot' && current.group === 'ship'));
		document.getElementById('outfitting_details_stored_rename').disabled = (!namehash || builtin);
		document.getElementById('outfitting_details_stored_delete').disabled = (!namehash || builtin);
		return true;
	}; // updateUIDetailsStoredModuleControls()


	var saveCurrentStoredModule = function(saveas) {
		var slot = getUIOutfittingSlot();
		if (!slot)
			return false;
		var modid = slot.getModuleID();
		var modulehash = slot.getStoredHash();
		if (!modid || !modulehash)
			return false;
		var select = document.forms.details.elements.outfitting_details_stored;
		var namehash = select.value;
		var oldnamehash = namehash;
		if (saveas || !namehash) {
			var name = hashDecodeS(namehash) || getModuleLabel(slot.getModule());
			do {
				name = prompt(getTranslation('message-module-save'), name);
				if (name === null)
					return false;
				name = (name || '').trim();
				namehash = hashEncodeS(name);
			} while (!name || (current.stored.moduleNamehashStored[0][namehash] && !confirm(getTranslation('interp-module-name-overwrite', {'name':name}))));
		}
		var stored = {
			modid:modid,
			namehash:namehash,
			name:hashDecodeS(namehash),
			modulehash:modulehash,
			engineer:slot.isModified(),
		};
		if (stored.name.startsWith(" ")) {
			alert(getTranslation('message-module-overwrite-builtin'));
			return false;
		}
		if (!current.stored.moduleNamehashStored[modid])
			current.stored.moduleNamehashStored[modid] = {};
		current.stored.moduleNamehashStored[0][namehash] = current.stored.moduleNamehashStored[modid][namehash] = stored;
		current.stored.moduleStoreds[0] = Object.values(current.stored.moduleNamehashStored[0]);
		current.stored.moduleStoreds[0].sort(sortStoreds);
		current.stored.moduleStoreds[modid] = Object.values(current.stored.moduleNamehashStored[modid]);
		current.stored.moduleStoreds[modid].sort(sortStoreds);
		current.stored.modulehashStored[modulehash] = stored;
		writeStoredModules();
		if (namehash !== oldnamehash) {
			updateUIModulePickerStoredModules();
			if (current.outfitting_focus === 'module') {
				setUIPickerModule(modid, namehash, true);
			}
			updateUIDetailsStoredModules();
		}
		updateUIDetailsStoredModuleControls(true, namehash);
		return true;
	}; // saveCurrentStoredModule()


	var renameStoredModule = function(namehash) {
		var stored = current.stored.moduleNamehashStored[0][namehash];
		if (!namehash || !stored || stored.name.startsWith(" "))
			return false;
		var oldnamehash = namehash;
		var name = stored.name;
		do {
			name = prompt(getTranslation('message-module-rename'), name);
			if (name === null)
				return false;
			name = (name || '').trim();
			namehash = hashEncodeS(name);
			if (namehash === oldnamehash)
				return false;
		} while (!name || (current.stored.moduleNamehashStored[0][namehash] && !confirm(getTranslation('interp-module-name-overwrite', {'name':name}))));
		stored.namehash = namehash;
		stored.name = name;
		current.stored.moduleNamehashStored[0][namehash] = current.stored.moduleNamehashStored[stored.modid][namehash] = stored;
		delete current.stored.moduleNamehashStored[0][oldnamehash];
		delete current.stored.moduleNamehashStored[stored.modid][oldnamehash];
		current.stored.moduleStoreds[0] = Object.values(current.stored.moduleNamehashStored[0]);
		current.stored.moduleStoreds[0].sort(sortStoreds);
		current.stored.moduleStoreds[stored.modid] = Object.values(current.stored.moduleNamehashStored[stored.modid]);
		current.stored.moduleStoreds[stored.modid].sort(sortStoreds);
		current.stored.modulehashStored[stored.modulehash] = stored;
		writeStoredModules();
		updateUIModulePickerStoredModules();
		var select = document.forms.details.elements.outfitting_details_stored;
		if (select.value === oldnamehash) {
			if (current.outfitting_focus === 'module') {
				setUIPickerModule(stored.modid, namehash, true);
			}
			updateUIDetailsStoredModules();
			select.value = namehash;
		} else {
			updateUIDetailsStoredModules();
		}
	}; // renameStoredModule()


	var deleteStoredModule = function(namehash) {
		var stored = current.stored.moduleNamehashStored[0][namehash];
		if (!namehash || !stored || stored.name.startsWith(" "))
			return false;
		var name = stored.name;
		if (!confirm(getTranslation('interp-module-name-delete', {'name':name})))
			return false;
		delete current.stored.moduleNamehashStored[0][namehash];
		delete current.stored.moduleNamehashStored[stored.modid][namehash];
		delete current.stored.modulehashStored[stored.modulehash];
		current.stored.moduleStoreds[0] = Object.values(current.stored.moduleNamehashStored[0]);
		current.stored.moduleStoreds[0].sort(sortStoreds);
		current.stored.moduleStoreds[stored.modid] = Object.values(current.stored.moduleNamehashStored[stored.modid]);
		current.stored.moduleStoreds[stored.modid].sort(sortStoreds);
		stored = null;
		writeStoredModules();
		updateUIModulePickerStoredModules();
		var select = document.forms.details.elements.outfitting_details_stored;
		if (select.value === namehash) {
			updateUIDetailsStoredModules();
			updateUIDetailsStoredModuleControls(true);
		} else {
			updateUIDetailsStoredModules();
		}
	}; // deleteStoredModule()


	var setUIDetailsNameHash = function(namehash) {
		if (current.outfitting_focus === 'slot') {
			if (namehash)
				return setCurrentFitSlotModule(current.group, current.slot, 0, namehash);
			var modid = current.fit.getSlot(current.group, current.slot).getModuleID();
			return setCurrentFitSlotModule(current.group, current.slot, modid);
		}

		var slot = current.pickerSlot;
		var ok;
		if (namehash) {
			ok = slot.setStoredHash(current.stored.moduleNamehashStored[0][namehash].modulehash);
		} else {
			var modid = slot.getModuleID();
			ok = slot.setModuleID(modid);
			if (ok)
				slot.setDiscounts(current.option.discounts);
		}
		if (!ok)
			return false;
		updateUIDetailsStoredModules();
		updateUIDetailsStoredModuleControls(true, namehash);
		updateUIDetailsModule();
		return true;
	}; // setUIDetailsNameHash()


	var updateUIDetailsModule = function() {
		var slot = getUIOutfittingSlot();
		if (!slot)
			return false;
		var modid = slot.getModuleID();
		var module = slot.getModule();

		// set displayed label
		var el = document.getElementById('outfitting_details_label');
		if (module) {
			if (slot.getSlotGroup() === 'ship' && slot.getSlotNum() === 'hull') {
				el.setAttribute('edsy-text', 'ship-'+modid);
				el.innerText = module.name;
			} else {
				var stored = current.stored.modulehashStored[slot.getStoredHash()] || EMPTY_OBJ;
				el.removeAttribute('edsy-text');
				el.replaceChildren();
				if (stored.tag) el.append(createIcon(ICON_TAG[stored.tag]), ' ');
				el.appendChild(getModuleLabelDOM(module, false, true));
				if (slot.isModified()) el.appendChild(createIcon('engineer'));
			}
		} else if (current.outfitting_focus === 'slot') {
			el.setAttribute('edsy-text', 'note-empty-slot');
			el.innerText = '(Empty Slot)';
		} else {
			el.setAttribute('edsy-text', 'option-no-module');
			el.innerText = '(No Module)';
		}
		document.getElementById('details_rank').innerHTML = '';
		if (module && (module.rank > 0)) {
			document.getElementById('details_rank').append(
				createTranslatedElement('span', (module.faction ? ('faction-'+module.faction.toLowerCase()) : 'unknown')),
				' ',
				createTranslatedElement('span', 'interp-rank-number', {'number':module.rank}),
				' (',
				createTranslatedElement('span', 'rank-'+module.faction.toLowerCase()+'-'+module.rank),
				')'
			);
		}

		// show or hide sections
		document.getElementById('details_cost').style.display = (module ? 'block' : 'none');
		document.getElementById('details_engineering').style.display = ((module && slot.isModifiable()) ? 'block' : 'none');
		document.getElementById('outfitting_details_table').style.display = (module ? '' : 'none');

		if (!module)
			return true;

		// rebuild blueprint selector
		var select = document.forms.details.elements.blueprint;
		var idlist = cache.mtypeBlueprints[module.mtype];
		var iddata = eddb.blueprint;
		for (var i = 0, o = 1;  idlist && i < idlist.length;  i++) {
			if (iddata[idlist[i]]) {
				while (select.options.length <= o)
					select.options.add(document.createElement('option'));
				select.options[o].value = idlist[i];
				select.options[o].setAttribute('edsy-text', 'blueprint-'+idlist[i]);
				select.options[o].text = iddata[idlist[i]].name;
				select.options[o].disabled = (module.noblueprints && (module.noblueprints['*'] || module.noblueprints[idlist[i]]))
				o++;
			}
		}
		while (select.options.length > o)
			select.options.remove(select.options.length - 1);

		// rebuild experimental selector
		var select = document.forms.details.elements.expeffect;
		var idlist = cache.mtypeExpeffects[module.mtype];
		var iddata = eddb.expeffect;
		for (var i = 0, o = 1;  idlist && i < idlist.length;  i++) {
			if (iddata[idlist[i]]) {
				while (select.options.length <= o)
					select.options.add(document.createElement('option'));
				select.options[o].value = idlist[i];
				select.options[o].setAttribute('edsy-text', 'expeffect-'+idlist[i]);
				select.options[o].text = iddata[idlist[i]].name;
				select.options[o].disabled = (module.noexpeffects && (module.noexpeffects['*'] || module.noexpeffects[idlist[i]]))
				o++;
			}
		}
		while (select.options.length > o)
			select.options.remove(select.options.length - 1);

		// rebuild attribute rows
		var attrs = getModuleAttrs(module);
		var tbody = document.getElementById('outfitting_details_attrs');
		while (tbody.rows.length < attrs.length) {
			addUIDetailsAttrRow();
		}
		for (var r = 0;  r < attrs.length;  r++) {
			var attr = attrs[r];
			var attribute = cache.attribute[attr];

			var abbr = document.getElementById('outfitting_details_abbr_' + r);
			abbr.setAttribute('edsy-text', 'attr-'+attr);
			abbr.innerHTML = attribute.name;
			abbr.setAttribute('edsy-title', 'attr-'+attr+'-desc');
			abbr.title = (attribute.desc || '');

			var input = document.getElementById('outfitting_details_input_' + r);
			input.name = attr;

			var unit = document.getElementById('outfitting_details_unit_' + r);
			unit.setAttribute('edsy-text', (UNIT_ABBR_TRANSLATIONS[attribute.unit || ''] || ''));
			unit.innerHTML = (attribute.unit || '');

			tbody.rows[r].style.display = '';
		}
		for (var r = attrs.length;  r < tbody.rows.length;  r++) {
			document.getElementById('outfitting_details_input_' + r).name = '_disabled_' + r;
			tbody.rows[r].style.display = 'none';
		}

		// set displayed cost and modification data
		updateUIDetailsCost();
		updateUIDetailsModifications();
		updateTranslations(document.getElementById('outfitting_details_module'));
		return true;
	}; // updateUIDetailsModule()


	var updateUIDetailsCost = function() {
		var slot = getUIOutfittingSlot();
		if (!slot)
			return false;
		var cost = slot.getCost();
		var base = slot.getBaseCost();
		var actual = slot.hasActualCost();
		var discounts = slot.getDiscounts();
		var disabled = (base < 1);
		var el = document.forms.details.elements.cost;
		el.value = formatNumText(cost, 0);
		el.size = max(cost, base).toString().length + 1;
		el.disabled = disabled;
		el = document.getElementById('details_cost_mod');
		el.innerHTML = ((base < 0 || base == cost) ? '' : formatPctHTML(cost / base - 1, 1));
		el.className = ((cost < base) ? 'modgood' : ((cost > base) ? 'modbad' : ''));
		el = document.getElementById('details_cost_label');
		var inputs = document.getElementById('details_cost').getElementsByTagName('INPUT');
		for (var i = 0;  i < inputs.length;  i++) {
			if (inputs[i].name === 'discount') {
				var bit = parseInt(inputs[i].value);
				inputs[i].checked = (bit ? (((discounts & bit) == bit) && ((discounts == 0x3F) == (bit == 0x3F))) : actual);
				inputs[i].disabled = disabled;
			}
		}
		return true;
	}; // updateUIDetailsCost()


	var setUIDetailsCost = function(cost) {
		var slot = getUIOutfittingSlot();
		if (!slot)
			return false;
		if (!slot.setCost(cost))
			return false;
		if (current.outfitting_focus === 'slot') {
			updateUIFitStoredBuildControls();
			updateUIFitSlot(current.group, current.slot);
			updateUIStats();
		}
		updateUIDetailsStoredModuleControls();
		updateUIDetailsCost();
		return true;
	}; // setUIDetailsCost()


	var setUIDetailsDiscounts = function(discounts) {
		var slot = getUIOutfittingSlot();
		if (!slot)
			return false;
		if (!slot.setDiscounts(discounts))
			return false;
		if (current.outfitting_focus === 'slot') {
			updateUIFitStoredBuildControls();
			updateUIFitSlot(current.group, current.slot);
			updateUIStats();
		}
		updateUIDetailsStoredModuleControls();
		updateUIDetailsCost();
		return true;
	}; // setUIDetailsDiscounts()


	var updateUIDetailsModifications = function() {
		var slot = getUIOutfittingSlot();
		if (!slot)
			return false;
		var mtypeid = slot.getModuleMtype();
		var modifiable = slot.isModifiable();
		var modified = slot.isModified();
		var preeng = slot.getPreEngineered();
		var bpid = slot.getBlueprintID();
		var bpgrade = slot.getBlueprintGrade();
		var bproll = slot.getBlueprintRoll();
		var expid = slot.getExpeffectID();

		document.forms.details.elements.pre_engineered.checked = !!preeng;

		var select = document.forms.details.elements.blueprint;
		select.disabled = (preeng || !((modifiable && cache.mtypeBlueprints[mtypeid]) || bpid));
		if (cache.mtypeBlueprints[mtypeid]) {
			select.value = (bpid || '');
		} else {
			select.selectedIndex = -1;
		}

		var select = document.forms.details.elements.expeffect;
		select.disabled = !((modifiable && cache.mtypeExpeffects[mtypeid] && (bpid || current.option.experimental)) || expid);
		if (cache.mtypeExpeffects[mtypeid]) {
			select.value = (expid || '');
		} else {
			select.selectedIndex = -1;
		}
		var special = (eddb.expeffect[expid] || EMPTY_OBJ).special;
		document.getElementById('details_special').setAttribute('edsy-text', (special ? ('expeffect-'+expid+'-special') : ''));
		document.getElementById('details_special').innerHTML = special || '';

		var maxgrade = ((bpid && !preeng) ? eddb.blueprint[bpid].maxgrade : 0);
		for (var g = 1;  g <= MAX_BLUEPRINT_GRADE;  g++) {
			document.getElementById('blueprint_grade_' + g).disabled = (g > maxgrade);
		}
		if (bpgrade) {
			document.forms.details.elements.blueprint_grade.value = bpgrade.toFixed(0);
		} else {
			var icon = document.getElementById('blueprint_grade_' + document.forms.details.elements.blueprint_grade.value);
			if (icon)
				icon.checked = false;
		}

		updateUIDetailsBlueprintRoll();

		var module = slot.getModule();
		if (module) {
			var input;
			for (var r = 0;  (input = document.getElementById('outfitting_details_input_' + r)) && cache.attribute[input.name];  r++) {
				var attr = input.name;
				var override = slot.isAttrOverridden(attr);
				var modifier = slot.getEffectiveAttrModifier(attr);
				var direction = getAttrModifierDirection(attr, modifier);
				var value = slot.getEffectiveAttrValue(attr);
				input.value = getModuleAttrValueText(module, attr, value);
				input.size = max(input.value.length, 3);
				input.disabled = (preeng || !((modifiable && isModuleAttrModifiable(module, attr) && (bpid || current.option.experimental)) || slot.getBaseAttrModifier(attr)));
				var moddisplay = document.getElementById('outfitting_details_mod_' + r);
				moddisplay.className = (direction ? ((direction < 0) ? 'modbad' : 'modgood') : '') + (override ? ' modoverride' : '');
				moddisplay.innerHTML = getModuleAttrModifierHTML(module, attr, modifier);
			}
		}
		updateTranslations(document.getElementById('outfitting_details_module'));
		return true;
	}; // updateUIDetailsModifications()


	var updateUIDetailsBlueprintRoll = function(bproll) {
		var slot = getUIOutfittingSlot();
		if (!slot)
			return false;
		var bpid = slot.getBlueprintID();
		if (bproll === undefined)
			bproll = (bpid ? slot.getBlueprintRoll() : 0);
		var preeng = slot.getPreEngineered();

		var className, disabled, value;
		if (!bpid || preeng) {
			className = 'disabled';
			disabled = true;
		} else if (bproll <= 0) {
			className = 'invalid';
			disabled = false;
		} else {
			className = '';
			disabled = false;
		}
		if (!bpid) {
			value = '';
		} else if (bproll <= 0) {
			value = getTranslation('n-a');
		} else {
			value = formatPctText(bproll, 1);
		}
		document.getElementById('engineering_roll').className = className;
		document.getElementById('roll_ring1').style.transform = ('rotate(' + (min(max(bproll / 0.5    , 0), 1) * 180).toFixed(0) + 'deg)');
		document.getElementById('roll_ring2').style.transform = ('rotate(' + (min(max(bproll / 0.5 - 1, 0), 1) * 180).toFixed(0) + 'deg)');
		document.forms.details.elements.blueprint_roll.disabled = disabled;
		document.forms.details.elements.blueprint_roll.value = value;
		document.forms.details.elements.blueprint_roll_preset1.disabled = disabled;
		document.forms.details.elements.blueprint_roll_preset2.disabled = disabled;
		document.forms.details.elements.blueprint_roll_preset3.disabled = disabled;
	}; // updateUIDetailsBlueprintRoll()


	var setUIDetailsPreEngineered = function(preeng) {
		var slot = getUIOutfittingSlot();
		if (!slot)
			return false;
		if (!slot.setPreEngineered(preeng))
			return false;
		if (current.outfitting_focus === 'slot') {
			updateUIFitStoredBuildControls();
			updateUIFitSlot(current.group, current.slot);
			updateUIStats();
		}
		updateUIDetailsStoredModuleControls();
		updateUIDetailsModifications();
		return true;
	}; // setUIDetailsPreEngineered()


	var setUIDetailsBlueprintID = function(bpid) {
		var slot = getUIOutfittingSlot();
		if (!slot)
			return false;
		if (!((slot.getBlueprintID() && bpid) ? slot.setBlueprintID(bpid) : slot.setBlueprint(bpid, MAX_BLUEPRINT_GRADE, (bpid || !current.option.experimental) ? 1.0 : null)))
			return false;
		if (!bpid) {
			slot.setBlueprintGrade(0);
			slot.setBlueprintRoll(0);
			if (!current.option.experimental)
				slot.setExpeffectID('');
		}
		if (current.outfitting_focus === 'slot') {
			updateUIFitStoredBuildControls();
			updateUIFitSlot(current.group, current.slot);
			updateUIStats();
		}
		updateUIDetailsStoredModuleControls();
		updateUIDetailsModifications();
		return true;
	}; // setUIDetailsBlueprintID()


	var setUIDetailsBlueprintGrade = function(bpgrade) {
		var slot = getUIOutfittingSlot();
		if (!slot)
			return false;
		if (!slot.setBlueprintGrade(bpgrade))
			return false;
		if (current.outfitting_focus === 'slot') {
			updateUIFitStoredBuildControls();
			updateUIFitSlot(current.group, current.slot);
			updateUIStats();
		}
		updateUIDetailsStoredModuleControls();
		updateUIDetailsModifications();
		return true;
	}; // setUIDetailsBlueprintGrade()


	var setUIDetailsBlueprintRoll = function(bproll) {
		var slot = getUIOutfittingSlot();
		if (!slot)
			return false;
		if (!slot.setBlueprintRoll(bproll))
			return false;
		if (current.outfitting_focus === 'slot') {
			updateUIFitStoredBuildControls();
			updateUIFitSlot(current.group, current.slot);
			updateUIStats();
		}
		updateUIDetailsStoredModuleControls();
		updateUIDetailsModifications();
		return true;
	}; // setUIDetailsBlueprintRoll()


	var setUIDetailsExpeffect = function(expid) {
		var slot = getUIOutfittingSlot();
		if (!slot)
			return false;
		if (!slot.setExpeffectID(expid))
			return false;
		if (current.outfitting_focus === 'slot') {
			updateUIFitStoredBuildControls();
			updateUIFitSlot(current.group, current.slot);
			updateUIStats();
		}
		updateUIDetailsStoredModuleControls();
		updateUIDetailsModifications();
		return true;
	}; // setUIDetailsExpeffect()


	var setUIDetailsAttrText = function(attr, text) {
		var slot = getUIOutfittingSlot();
		if (!slot)
			return false;
		var module = slot.getModule();
		var attribute = cache.attribute[attr];
		if (!module || !attribute)
			return false;
		text = text.trim();
		if (text === '') {
			if (!slot.setAttrModifier(attr))
				return false;
		} else {
			if (text.slice(-1) === '%' && (attribute.unit !== '%' || text[0] === '+' || text[0] === '-')) {
				var modifier = parseModuleAttrModifierText(module, attr, text);
			} else {
				var modifier = getModuleAttrModifier(module, attr, parseNumText(text));
			}
			if (!slot.setEffectiveAttrModifier(attr, modifier))
				return false;
		}
		if (slot.getBlueprintRoll())
			slot.setBlueprintRoll(0);
		if (current.outfitting_focus === 'slot') {
			updateUIFitStoredBuildControls();
			updateUIFitSlot(current.group, current.slot);
			updateUIStats();
		}
		updateUIDetailsStoredModuleControls();
		updateUIDetailsModifications();
		return true;
	}; // setUIDetailsAttrText()


	/*
	* STATS UI
	*/


	var setStatsCurFuel = function(value) {
		value = min(max(value, 0), current.fit.getStat('fuelcap'));
		document.forms.stats.elements.stats_cur_fuel.value = formatNumText(value, (value % 1) ? 1 : 0);
		updateUIStats();
	}; // setStatsCurFuel()


	var setStatsCurCargo = function(value) {
		value = min(max((value + 0.5) | 0, 0), current.fit.getStat('cargocap'));
		document.forms.stats.elements.stats_cur_cargo.value = formatNumText(value, 0);
		updateUIStats();
	}; // setStatsCurCargo()


	var updateUIStatsPanels = function(enabledPanel) {
		var space = document.getElementById('outfitting_stats_wrapper').clientWidth * 0.95;
		var next = 0;
		var panels = [];
		var panelOrder = {};
		var panelWidth = {};
		var input, panel;
		for (var p = 1;  (input = document.getElementById('stats_toggle_' + p)) && (panel = document.getElementById('outfitting_stats_' + p));  p++) {
			if (input.checked) {
				panels.push(p);
				panelOrder[p] = parseInt(input.value);
				panelWidth[p] = panel.offsetWidth;
				next = max(next, panelOrder[p]);
			}
			space -= panel.offsetWidth;
		}
		if (enabledPanel) {
			next++;
			panelOrder[enabledPanel] = next;
			document.getElementById('stats_toggle_' + enabledPanel).value = next;
		}
		if (current.option.hidestats && space < 0) {
			panels.sort(function(p1,p2) { return panelOrder[p2] - panelOrder[p1]; });
			while (space < 0 && panels.length > 1) {
				var p = panels.pop();
				document.getElementById('stats_toggle_' + p).checked = false;
				space += panelWidth[p];
			}
		}
	}; // updateUIStatsPanels()


	var updateUIStats = function() {
		// mark undersized fitted power plant
		var pwrdraw_ret = current.fit.getStat('pwrdraw_ret');
		var pwrbst = current.fit.getStat('pwrbst') / 100.0;
		var slot = current.fit.getSlot('component', CORE_ABBR_SLOT.PP);
		document.getElementById('outfitting_fit_module_component_' + CORE_ABBR_SLOT.PP).classList.toggle('notenough', (slot.getEffectiveAttrValue('pwrcap') * (1 + pwrbst)) < pwrdraw_ret[0]);

		// mark undersized fitted thruster
		var massBase = current.fit.getStat('mass') + current.fit.getStat('fuelcap') + current.fit.getStat('cargocap');
		var slot = current.fit.getSlot('component', CORE_ABBR_SLOT.TH);
		document.getElementById('outfitting_fit_module_component_' + CORE_ABBR_SLOT.TH).classList.toggle('notenough', slot.getEffectiveAttrValue('engmaxmass') < massBase);
		document.getElementById('outfitting_stats_max_mass').classList.toggle('error', slot.getEffectiveAttrValue('engmaxmass') < massBase);
		massBase -= slot.getEffectiveAttrValue('mass');

		// mark undersized power plant and thruster options
		for (var mtype in { cpp:1, ct:1 }) {
			for (var m = 0;  m < cache.mtypeModules[mtype].length;  m++) {
				var modid = cache.mtypeModules[mtype][m];
				var namehashes = Object.keys(current.stored.moduleNamehashStored[modid] || EMPTY_OBJ);
				namehashes.push('');
				for (var n = 0;  n < namehashes.length;  n++) {
					var namehash = namehashes[n];
					if (namehash) {
						current.tempSlot.setStoredHash(current.stored.moduleNamehashStored[0][namehash].modulehash);
					} else {
						current.tempSlot.setModuleID(modid);
					}
					var notenough = false;
					switch (mtype) {
					case 'ct':
						notenough = (current.tempSlot.getEffectiveAttrValue('engmaxmass') < (massBase + current.tempSlot.getEffectiveAttrValue('mass')));
						break;

					case 'cpp':
						notenough = ((current.tempSlot.getEffectiveAttrValue('pwrcap') * (1 + pwrbst)) < pwrdraw_ret[0]);
						break;
					}
					document.getElementById('outfitting_module.' + modid + '.' + namehash).classList.toggle('notenough', !!notenough);
				}
			}
		}

		updateUIStatsTotals();
		updateUIStatsPower();
		updateUIStatsNavFSD();
		updateUIStatsNavThr();
		updateUIStatsThm();
		updateUIStatsShd();
		updateUIStatsArm();
		updateUIStatsWpn();
		current.fit.clearPrevStats();

		updateUIFitHash();
		updateTranslations(document.getElementById('outfitting_stats_container'));
	}; // updateUIStats()


	var updateUIStatsTotals = function() {
		// get primary stats
		var rebuy = 1 - (parseFloat(current.option.insurance) / 10000.0);
		var fuelres = eddb.ship[current.fit.getShipID()].fuelreserve;
		var cost = current.fit.getStat('cost');
		var mass = current.fit.getStat('mass');
		var fuelcap = current.fit.getStat('fuelcap');
		var fuelcapPrev = current.fit.getPrevStat('fuelcap');
		var cargocap = current.fit.getStat('cargocap');
		var cargocapPrev = current.fit.getPrevStat('cargocap');
		var cabincap = current.fit.getStat('cabincap');

		// limit current fuel and cargo to maximums and calculate derived stats
		var curTtlFuel = min(max(parseNumText(document.forms.stats.elements.stats_cur_fuel.value) || 0, 0), fuelcap);
		if (fuelcapPrev && fuelcapPrev != fuelcap) {
			curTtlFuel = (curTtlFuel == fuelcapPrev) ? fuelcap : min(fuelcap, curTtlFuel);
			document.forms.stats.elements.stats_cur_fuel.value = formatNumText(curTtlFuel, (curTtlFuel % 1) ? 1 : 0);
		}
		var curTtlCrgo = min(max(parseNumText(document.forms.stats.elements.stats_cur_cargo.value) || 0, 0), cargocap);
		if (cargocapPrev && cargocapPrev != cargocap) {
			curTtlCrgo = (curTtlCrgo == cargocapPrev) ? cargocap : min(cargocap, curTtlCrgo);
			document.forms.stats.elements.stats_cur_cargo.value = formatNumText(curTtlCrgo, 0);
		}
		// in-game, fuelres is included when displaying current mass but not max mass
		var curTtlMass = mass + curTtlFuel + fuelres + curTtlCrgo;
		var maxTtlMass = mass + fuelcap              + cargocap;

		// update displays
		document.getElementById('outfitting_stats_cur_mass').innerHTML = formatAttrHTML('mass', curTtlMass, 1);
		document.getElementById('outfitting_stats_max_mass').innerHTML = formatAttrHTML('mass', maxTtlMass, 1);
		document.getElementById('outfitting_stats_max_fuel').innerHTML = formatAttrHTML('fuelcap', fuelcap, 0);
		document.getElementById('outfitting_stats_max_cargo').innerHTML = formatAttrHTML('cargocap', cargocap, 0);
		document.getElementById('outfitting_stats_max_psgr').innerHTML = formatAttrHTML('cabincap', cabincap, 0);

		// TODO: prices in a separate function
		var htmlNA = '<small class="semantic" edsy-text="n-a">N/A</small>';
		var cost_vehicle = current.fit.getStat('cost_vehicle');
		var cost_restock = current.fit.getStat('cost_restock');
		var cost_rearm = current.fit.getStat('cost_rearm');
		var cost_rebuy = cost * rebuy;
		document.getElementById('outfitting_prc_fuel').innerHTML = formatPriceHTML(eddb.ship[current.fit.getShipID()].fuelcost * fuelcap, false);
		document.getElementById('outfitting_prc_vehicle').innerHTML = (!cost_vehicle ? htmlNA : formatPriceHTML(cost_vehicle, false));
		document.getElementById('outfitting_prc_misc').innerHTML = (!cost_restock ? htmlNA : formatPriceHTML(cost_restock, false));
		document.getElementById('outfitting_prc_ammo').innerHTML = (!cost_rearm ? htmlNA : formatPriceHTML(cost_rearm, false));
		document.getElementById('outfitting_stats_rebuy').innerHTML = formatPriceHTML(cost_rebuy, cost_rebuy > 999999);
		document.getElementById('outfitting_stats_price').innerHTML = formatPriceHTML(cost, cost > 999999);
	}; // updateUIStatsTotals()


	var updateUIStatsPower = function() {
		// get primary stats
		var pwrcap = current.fit.getStat('pwrcap');
		var pwrcap_pwrbst = pwrcap * (1 + (current.fit.getStat('pwrbst') / 100.0));
		var pwrdraw_ret = current.fit.getStat('pwrdraw_ret');
		var pwrdraw_dep = current.fit.getStat('pwrdraw_dep');

		// update displays
		// pwrbst does not increase the displayed MW output of the plant, so %usage remains the same
		// instead, %usage is allowed to go to (e.g.) 104% before overloading
		var classes = '';
		var pwrdraw_ret_ttl = 0;
		var pwrdraw_dep_ttl = 0;
		for (var p = 1;  p <= MAX_POWER_PRIORITY;  p++) {
			pwrdraw_ret_ttl += pwrdraw_ret[p];
			var width = (90.0 * pwrdraw_ret[p] / pwrcap);
			var abbr = document.getElementById('outfitting_stats_power_ret_' + p);
			abbr.setAttribute('edsy-vals', JSON.stringify({'pwrdraw':pwrdraw_ret_ttl, 'pwrdraw#':2, 'pwrcap':pwrcap, 'pwrcap#':2, 'percent':(pwrdraw_ret_ttl/pwrcap), 'percent#':1, 'percent%':true}));
			abbr.setAttribute('edsy-title', 'interp-pwrdraw-pwrcap-megawatts-percent');
			abbr.title = (formatNumText(pwrdraw_ret_ttl, 2) + ' / ' + formatNumText(pwrcap, 2) + ' MW (' + formatPctText(pwrdraw_ret_ttl / pwrcap, 1) + ')');
			abbr.style.display = (width > 0.0) ? '' : 'none';
			abbr.style.width = width.toFixed(3) + '%';
			abbr.className = ((pwrdraw_ret_ttl > pwrcap_pwrbst) ? 'err' : ((pwrdraw_ret_ttl <= MAX_MALFUNCTION_PWRCAP * pwrcap_pwrbst) ? 'mfn' : ((pwrdraw_ret_ttl <= MAX_DAMAGED_PWRCAP * pwrcap_pwrbst) ? 'dmg' : '')));

			pwrdraw_dep_ttl += pwrdraw_dep[p];
			var width = (90.0 * pwrdraw_dep[p] / pwrcap);
			var abbr = document.getElementById('outfitting_stats_power_dep_' + p);
			abbr.setAttribute('edsy-vals', JSON.stringify({'pwrdraw':pwrdraw_dep_ttl, 'pwrdraw#':2, 'pwrcap':pwrcap, 'pwrcap#':2, 'percent':(pwrdraw_dep_ttl/pwrcap), 'percent#':1, 'percent%':true}));
			abbr.setAttribute('edsy-title', 'interp-pwrdraw-pwrcap-megawatts-percent');
			abbr.title = (formatNumText(pwrdraw_dep_ttl, 2) + ' / ' + formatNumText(pwrcap, 2) + ' MW (' + formatPctText(pwrdraw_dep_ttl / pwrcap, 1) + ')');
			abbr.style.display = (width > 0.0) ? '' : 'none';
			abbr.style.width = width.toFixed(3) + '%';
			abbr.className = ((pwrdraw_dep_ttl > pwrcap_pwrbst) ? 'err' : ((pwrdraw_dep_ttl <= MAX_MALFUNCTION_PWRCAP * pwrcap_pwrbst) ? 'mfn' : ((pwrdraw_dep_ttl <= MAX_DAMAGED_PWRCAP * pwrcap_pwrbst) ? 'dmg' : '')));

			if (pwrdraw_ret_ttl <= MAX_MALFUNCTION_PWRCAP * pwrcap_pwrbst) {
				classes += ' priority' + p + 'mfnret';
			} else if (pwrdraw_ret_ttl <= MAX_DAMAGED_PWRCAP * pwrcap_pwrbst) {
				classes += ' priority' + p + 'dmgret';
			} else if (pwrdraw_ret_ttl > pwrcap_pwrbst) {
				classes += ' priority' + p + 'errret';
			}

			if (pwrdraw_dep_ttl <= MAX_MALFUNCTION_PWRCAP * pwrcap_pwrbst) {
				classes += ' priority' + p + 'mfndep';
			} else if (pwrdraw_dep_ttl <= MAX_DAMAGED_PWRCAP * pwrcap_pwrbst) {
				classes += ' priority' + p + 'dmgdep';
			} else if (pwrdraw_dep_ttl > pwrcap_pwrbst) {
				classes += ' priority' + p + 'errdep';
			}
		}
		document.getElementById('outfitting_fit_slots').className = classes.substring(1);
		/* TODO: powerdist in fit
		document.getElementById('outfitting_stats_power_ret').innerHTML = (formatNumHTML(pwrdraw_ret[0], 2) + ' <small class="semantic">/</small> ' + formatAttrHTML('pwrcap', pwrcap, 2) + ' (' + formatPctHTML(pwrdraw_ret[0] / pwrcap, 1) + ')');
		document.getElementById('outfitting_stats_power_ret').className = ((pwrdraw_ret[0] > pwrcap_pwrbst) ? 'error' : '');
		document.getElementById('outfitting_stats_power_dep').innerHTML = (formatNumHTML(pwrdraw_dep[0], 2) + ' <small class="semantic">/</small> ' + formatAttrHTML('pwrcap', pwrcap, 2) + ' (' + formatPctHTML(pwrdraw_dep[0] / pwrcap, 1) + ')');
		document.getElementById('outfitting_stats_power_dep').className = ((pwrdraw_dep[0] > pwrcap_pwrbst) ? 'error' : '');
		*/
		var abbr = createTranslatedElement('abbr', 'interp-number', {'number':(pwrdraw_ret[0]/pwrcap), 'number#':1, 'number%':true});
		abbr.className = ((pwrdraw_ret[0] > pwrcap_pwrbst) ? 'error' : '');
		abbr.setAttribute('edsy-vals-title', JSON.stringify({'pwrdraw':pwrdraw_ret[0], 'pwrdraw#':2, 'pwrcap':pwrcap, 'pwrcap#':2, 'percent':(pwrdraw_ret[0]/pwrcap), 'percent#':1, 'percent%':true}));
		abbr.setAttribute('edsy-title', 'interp-pwrdraw-pwrcap-megawatts-percent');
		abbr.title = formatNumText(pwrdraw_ret[0], 2) + ' / ' + formatNumText(pwrcap, 2) + ' MW (' + formatPctText(pwrdraw_ret[0] / pwrcap, 1) + ')';
		abbr.innerHTML = formatPctHTML(pwrdraw_ret[0] / pwrcap, 1);
		document.getElementById('outfitting_stats_power_ret').replaceChildren(abbr);
		var abbr = createTranslatedElement('abbr', 'interp-number', {'number':(pwrdraw_dep[0]/pwrcap), 'number#':1, 'number%':true});
		abbr.className = ((pwrdraw_dep[0] > pwrcap_pwrbst) ? 'error' : '');
		abbr.setAttribute('edsy-vals-title', JSON.stringify({'pwrdraw':pwrdraw_dep[0], 'pwrdraw#':2, 'pwrcap':pwrcap, 'pwrcap#':2, 'percent':(pwrdraw_dep[0]/pwrcap), 'percent#':1, 'percent%':true}));
		abbr.setAttribute('edsy-title', 'interp-pwrdraw-pwrcap-megawatts-percent');
		abbr.title = formatNumText(pwrdraw_dep[0], 2) + ' / ' + formatNumText(pwrcap, 2) + ' MW (' + formatPctText(pwrdraw_dep[0] / pwrcap, 1) + ')';
		abbr.innerHTML = formatPctHTML(pwrdraw_dep[0] / pwrcap, 1);
		document.getElementById('outfitting_stats_power_dep').replaceChildren(abbr);
	}; // updateUIStatsPower()


	var updateUIStatsNavFSD = function() {
		// get primary stats
		var fuelres = eddb.ship[current.fit.getShipID()].fuelreserve;
		var mass = current.fit.getStat('mass');
		var jumpbst = current.fit.getStat('jumpbst');
		var fuelcap = current.fit.getStat('fuelcap');
		var cargocap = current.fit.getStat('cargocap');
		var scooprate = current.fit.getStat('scooprate');
		var slot = current.fit.getSlot('component', CORE_ABBR_SLOT.FD);
		var fsdopt = slot.getEffectiveAttrValue('fsdoptmass');
		var fsdfuel = slot.getEffectiveAttrValue('maxfuel');
		var fsdmul = slot.getEffectiveAttrValue('fuelmul');
		var fsdpower = slot.getEffectiveAttrValue('fuelpower');

		// get or compute derived stats
		var curTtlFuel = min(max(parseNumText(document.forms.stats.elements.stats_cur_fuel.value) || 0, 0), fuelcap);
		var curTtlCrgo = min(max(parseNumText(document.forms.stats.elements.stats_cur_cargo.value) || 0, 0), cargocap);
		var ldnNavJmp = current.fit.getStat('_jump_laden');
		var unlNavJmp = current.fit.getStat('_jump_unladen');
		var curNavJmp = getJumpDistance(mass + curTtlCrgo, curTtlFuel, fsdfuel, fsdopt, fsdmul, fsdpower, jumpbst);
		var maxNavJmp = current.fit.getStat('_jump_max');
		var curNavRng = getJumpRange(mass + curTtlCrgo, curTtlFuel, fsdfuel, fsdopt, fsdmul, fsdpower, jumpbst);
		var ldnNavRng = current.fit.getStat('_range_laden');
		var unlNavRng = current.fit.getStat('_range_unladen');
		var scpNavJmp = min(fuelcap, fsdfuel) / scooprate;
		var scpNavRng = fuelcap / scooprate;

		// update displays
		var htmlNA = '<small class="semantic" edsy-text="n-a">N/A</small>';
		var htmlLY = '<small edsy-text"unit-lightyears-abbr">LY</small';
		document.getElementById('outfitting_stats_cur_jump'    ).innerHTML = formatNumHTML(curNavJmp, 2) + htmlLY;
		document.getElementById('outfitting_stats_laden_jump'  ).innerHTML = formatNumHTML(ldnNavJmp, 2) + htmlLY;
		document.getElementById('outfitting_stats_unladen_jump').innerHTML = formatNumHTML(unlNavJmp, 2) + htmlLY;
		document.getElementById('outfitting_stats_max_jump'    ).innerHTML = formatNumHTML(maxNavJmp, 2) + htmlLY;
		document.getElementById('outfitting_stats_cur_range'    ).innerHTML = formatNumHTML(curNavRng, 2) + htmlLY;
		document.getElementById('outfitting_stats_laden_range'  ).innerHTML = formatNumHTML(ldnNavRng, 2) + htmlLY;
		document.getElementById('outfitting_stats_unladen_range').innerHTML = formatNumHTML(unlNavRng, 2) + htmlLY;
		document.getElementById('outfitting_stats_scoop_jump' ).innerHTML = (scooprate ? formatTimeHTML(scpNavJmp, true) : htmlNA);
		document.getElementById('outfitting_stats_scoop_range').innerHTML = (scooprate ? formatTimeHTML(scpNavRng, true) : htmlNA);
		document.getElementById('outfitting_stats_scoop_speed').innerHTML = (scooprate ? formatAttrHTML('scooprate', scooprate) : htmlNA);
	}; // updateUIStatsNavFSD()


	var updateUIStatsNavThr = function() {
		// get primary stats
		var fuelres = eddb.ship[current.fit.getShipID()].fuelreserve;
		var mass = current.fit.getStat('mass');
		var fuelcap = current.fit.getStat('fuelcap');
		var cargocap = current.fit.getStat('cargocap');
		var powerdist_eng = current.fit.getEffectivePowerDist('eng');

		var slot = current.fit.getSlot('ship', 'hull');
		var minthrust = slot.getEffectiveAttrValue('minthrust') / 100.0;
		var boostcost = slot.getEffectiveAttrValue('boostcost');
		var boostint = slot.getEffectiveAttrValue('boostint');
		var topspd = slot.getEffectiveAttrValue('topspd');
		var bstspd = slot.getEffectiveAttrValue('bstspd');
		var pitch = slot.getEffectiveAttrValue('pitch');
		var roll = slot.getEffectiveAttrValue('roll');
		var yaw = slot.getEffectiveAttrValue('yaw');
		var minpitch = slot.getEffectiveAttrValue('minpitch');
		var minroll = slot.getEffectiveAttrValue('minroll');
		var minyaw = slot.getEffectiveAttrValue('minyaw');

		var slot = current.fit.getSlot('component', CORE_ABBR_SLOT.PD);
		var engcap = slot.getEffectiveAttrValue('engcap');
		var engchg = slot.getEffectiveAttrValue('engchg');

		var slot = current.fit.getSlot('component', CORE_ABBR_SLOT.TH);
		var minmass = slot.getEffectiveAttrValue('engminmass');
		var optmass = slot.getEffectiveAttrValue('engoptmass');
		var maxmass = slot.getEffectiveAttrValue('engmaxmass');
		var minmulspd = slot.getEffectiveAttrValue('minmulspd');
		var optmulspd = slot.getEffectiveAttrValue('optmulspd');
		var maxmulspd = slot.getEffectiveAttrValue('maxmulspd');
		var minmulrot = slot.getEffectiveAttrValue('minmulrot');
		var optmulrot = slot.getEffectiveAttrValue('optmulrot');
		var maxmulrot = slot.getEffectiveAttrValue('maxmulrot');

		// compute derived stats
		var curTtlFuel = min(max(parseNumText(document.forms.stats.elements.stats_cur_fuel.value) || 0, 0), fuelcap);
		var curTtlCrgo = min(max(parseNumText(document.forms.stats.elements.stats_cur_cargo.value) || 0, 0), cargocap);
		var powerdistEngMul = powerdist_eng / MAX_POWER_DIST;
		var curNavSpdMul = getMassCurveMultiplier(mass + curTtlFuel + fuelres + curTtlCrgo, minmass, optmass, maxmass, minmulspd, optmulspd, maxmulspd) / 100;
		var ldnNavSpdMul = getMassCurveMultiplier(mass + fuelcap              + cargocap  , minmass, optmass, maxmass, minmulspd, optmulspd, maxmulspd) / 100;
		var unlNavSpdMul = getMassCurveMultiplier(mass + fuelcap                          , minmass, optmass, maxmass, minmulspd, optmulspd, maxmulspd) / 100;
		var maxNavSpdMul = getMassCurveMultiplier(mass                                    , minmass, optmass, maxmass, minmulspd, optmulspd, maxmulspd) / 100;
		var engcapEnough = (engcap >= boostcost + BOOST_MARGIN);
		var curNavFrq = (boostcost / (engchg * pow(powerdist_eng / MAX_POWER_DIST, 1.1)));
		var maxNavFrq = (boostcost / engchg);
		var curHndRotMul = getMassCurveMultiplier(mass + curTtlFuel + fuelres + curTtlCrgo, minmass, optmass, maxmass, minmulrot, optmulrot, maxmulrot) / 100;
		var maxHndRotMul = getMassCurveMultiplier(mass                                    , minmass, optmass, maxmass, minmulrot, optmulrot, maxmulrot) / 100;

		// update nav displays
		var htmlErrorTH = '<abbr class="error" edsy-title="ui-stats-nav-error-thruster" title="Thruster has insufficient maximum mass" edsy-text="ui-stats-nav-error-abbr">ERR</abbr>';
		var htmlErrorPD = '<abbr class="error" edsy-title="ui-stats-nav-error-distributor" title="Power distributor has insufficient ENG capacitor to boost" edsy-text="ui-stats-nav-error-abbr">ERR</abbr>';
		var htmlCurNavFrq = formatTimeHTML(max(boostint, curNavFrq), true);
		if (curNavFrq <= boostint)
			htmlCurNavFrq = '<abbr class="" edsy-title="ui-stats-nav-boost-often" title="Can boost as often as possible">' + htmlCurNavFrq + '</abbr>';
		var htmlMaxNavFrq = formatTimeHTML(max(boostint, maxNavFrq), true);
		if (maxNavFrq <= boostint)
			htmlMaxNavFrq = '<abbr class="" edsy-title="ui-stats-nav-boost-often" title="Can boost as often as possible">' + htmlMaxNavFrq + '</abbr>';
		document.getElementById('outfitting_stats_cur_speed'    ).innerHTML = (isNaN(curNavSpdMul) ? htmlErrorTH : formatAttrHTML('topspd', curNavSpdMul * topspd * (powerdistEngMul + minthrust * (1 - powerdistEngMul))));
		document.getElementById('outfitting_stats_laden_speed'  ).innerHTML = (isNaN(ldnNavSpdMul) ? htmlErrorTH : formatAttrHTML('topspd', ldnNavSpdMul * topspd));
		document.getElementById('outfitting_stats_unladen_speed').innerHTML = (isNaN(unlNavSpdMul) ? htmlErrorTH : formatAttrHTML('topspd', unlNavSpdMul * topspd));
		document.getElementById('outfitting_stats_max_speed'    ).innerHTML = (isNaN(maxNavSpdMul) ? htmlErrorTH : formatAttrHTML('topspd', maxNavSpdMul * topspd));
		document.getElementById('outfitting_stats_cur_boost'    ).innerHTML = (isNaN(curNavSpdMul) ? htmlErrorTH : (!engcapEnough ? htmlErrorPD : formatAttrHTML('bstspd', curNavSpdMul * bstspd)));
		document.getElementById('outfitting_stats_laden_boost'  ).innerHTML = (isNaN(ldnNavSpdMul) ? htmlErrorTH : (!engcapEnough ? htmlErrorPD : formatAttrHTML('bstspd', ldnNavSpdMul * bstspd)));
		document.getElementById('outfitting_stats_unladen_boost').innerHTML = (isNaN(unlNavSpdMul) ? htmlErrorTH : (!engcapEnough ? htmlErrorPD : formatAttrHTML('bstspd', unlNavSpdMul * bstspd)));
		document.getElementById('outfitting_stats_max_boost'    ).innerHTML = (isNaN(maxNavSpdMul) ? htmlErrorTH : (!engcapEnough ? htmlErrorPD : formatAttrHTML('bstspd', maxNavSpdMul * bstspd)));
		document.getElementById('outfitting_stats_cur_boostfreq').innerHTML = (isNaN(curNavSpdMul) ? htmlErrorTH : (!engcapEnough ? htmlErrorPD : htmlCurNavFrq));
		document.getElementById('outfitting_stats_max_boostfreq').innerHTML = (isNaN(maxNavSpdMul) ? htmlErrorTH : (!engcapEnough ? htmlErrorPD : htmlMaxNavFrq));

		// update hnd displays
		document.getElementById('outfitting_stats_cur_pitch'    ).innerHTML = (isNaN(curHndRotMul) ? htmlErrorTH : formatAttrHTML('pitch', curHndRotMul * (pitch * powerdistEngMul + minpitch * (1 - powerdistEngMul))));
		document.getElementById('outfitting_stats_cur_roll'     ).innerHTML = (isNaN(curHndRotMul) ? htmlErrorTH : formatAttrHTML('roll' , curHndRotMul * (roll  * powerdistEngMul + minroll  * (1 - powerdistEngMul))));
		document.getElementById('outfitting_stats_cur_yaw'      ).innerHTML = (isNaN(curHndRotMul) ? htmlErrorTH : formatAttrHTML('yaw'  , curHndRotMul * (yaw   * powerdistEngMul + minyaw   * (1 - powerdistEngMul))));
		document.getElementById('outfitting_stats_cur_pitchtime').innerHTML = (isNaN(curHndRotMul) ? htmlErrorTH : formatTimeHTML(180.0 / (curHndRotMul * (pitch * powerdistEngMul + minpitch * (1 - powerdistEngMul))), true));
		document.getElementById('outfitting_stats_cur_rolltime' ).innerHTML = (isNaN(curHndRotMul) ? htmlErrorTH : formatTimeHTML(180.0 / (curHndRotMul * (roll  * powerdistEngMul + minroll  * (1 - powerdistEngMul))), true));
		document.getElementById('outfitting_stats_cur_yawtime'  ).innerHTML = (isNaN(curHndRotMul) ? htmlErrorTH : formatTimeHTML(180.0 / (curHndRotMul * (yaw   * powerdistEngMul + minyaw   * (1 - powerdistEngMul))), true));
		document.getElementById('outfitting_stats_max_pitch'    ).innerHTML = (isNaN(maxHndRotMul) ? htmlErrorTH : formatAttrHTML('pitch', curHndRotMul * pitch));
		document.getElementById('outfitting_stats_max_roll'     ).innerHTML = (isNaN(maxHndRotMul) ? htmlErrorTH : formatAttrHTML('roll' , curHndRotMul * roll));
		document.getElementById('outfitting_stats_max_yaw'      ).innerHTML = (isNaN(maxHndRotMul) ? htmlErrorTH : formatAttrHTML('yaw'  , curHndRotMul * yaw));
		document.getElementById('outfitting_stats_max_pitchtime').innerHTML = (isNaN(maxHndRotMul) ? htmlErrorTH : formatTimeHTML(180.0 / (curHndRotMul * pitch), true));
		document.getElementById('outfitting_stats_max_rolltime' ).innerHTML = (isNaN(maxHndRotMul) ? htmlErrorTH : formatTimeHTML(180.0 / (curHndRotMul * roll), true));
		document.getElementById('outfitting_stats_max_yawtime'  ).innerHTML = (isNaN(maxHndRotMul) ? htmlErrorTH : formatTimeHTML(180.0 / (curHndRotMul * yaw), true));
	}; // updateUIStatsNavThr()


	var updateUIStatsThm = function() {
		// get primary stats
		var pwrcap = current.fit.getStat('pwrcap');
		var pwrcap_pwrbst = pwrcap * (1 + (current.fit.getStat('pwrbst') / 100.0));
		var pwrdraw_ret = current.fit.getStat('pwrdraw_ret');
		var pwrdraw_dep = current.fit.getStat('pwrdraw_dep');
		var thmload_ct = current.fit.getStat('thmload_ct');
		var thmload_cfsd = current.fit.getStat('thmload_cfsd');
		var thmload_hardpoint_wepfull = current.fit.getStat('thmload_hardpoint_wepfull');
		var thmload_hardpoint_wepempty = current.fit.getStat('thmload_hardpoint_wepempty');
		var thmload_iscb = current.fit.getStat('thmload_iscb');
		var spinup_iscb = current.fit.getStat('spinup_iscb');
		var wepchg_sustain_cur = current.fit.getStat('wepchg_sustain_cur');

		var slot = current.fit.getSlot('ship', 'hull');
		var heatcap = slot.getEffectiveAttrValue('heatcap');
		var heatdismax = slot.getEffectiveAttrValue('heatdismax');

		var slot = current.fit.getSlot('component', CORE_ABBR_SLOT.PP);
		var heateff = slot.getEffectiveAttrValue('heateff');

		// compute derived stats
		// pwrbst does not increase the displayed MW output of the plant, so %usage remains the same
		// instead, %usage is allowed to go to (e.g.) 104% before overloading
		var thmload_pwrdraw_ret = pwrdraw_ret[0];
		for (var p = MAX_POWER_PRIORITY;  p >= 1 && thmload_pwrdraw_ret > pwrcap_pwrbst;  p--) {
			thmload_pwrdraw_ret -= pwrdraw_ret[p];
		}
		thmload_pwrdraw_ret *= heateff;
		var thmload_pwrdraw_dep = pwrdraw_dep[0];
		for (var p = MAX_POWER_PRIORITY;  p >= 1 && thmload_pwrdraw_dep > pwrcap_pwrbst;  p--) {
			thmload_pwrdraw_dep -= pwrdraw_dep[p];
		}
		thmload_pwrdraw_dep *= heateff;
		thmload_hardpoint_wepfull *= wepchg_sustain_cur;
		thmload_hardpoint_wepempty *= wepchg_sustain_cur;

		// update displays
		updateUIStatsThmLevel('outfitting_stats_idl_heat'     , thmload_pwrdraw_ret       , 0                               , heatdismax, heatcap);
		updateUIStatsThmLevel('outfitting_stats_thr_heat'     , thmload_ct                , thmload_pwrdraw_ret             , heatdismax, heatcap);
		updateUIStatsThmLevel('outfitting_stats_fsd_heat'     , thmload_cfsd              , thmload_pwrdraw_ret + thmload_ct, heatdismax, heatcap);
		updateUIStatsThmLevel('outfitting_stats_wpnfull_heat' , thmload_hardpoint_wepfull , thmload_pwrdraw_dep + thmload_ct, heatdismax, heatcap);
		updateUIStatsThmLevel('outfitting_stats_wpnempty_heat', thmload_hardpoint_wepempty, thmload_pwrdraw_dep + thmload_ct, heatdismax, heatcap);
		updateUIStatsThmLevel('outfitting_stats_scb_heat'     , thmload_iscb              , thmload_pwrdraw_dep + thmload_ct, heatdismax, heatcap, spinup_iscb);
	}; // updateUIStatsThm()


	var updateUIStatsThmLevel = function(elementid, thmload, thmloadBase, heatdismax, heatcap, duration) {
		var el = document.getElementById(elementid);
		el.className = '';
		if (thmload > 0) {
			thmload += thmloadBase;
			if (thmloadBase > heatdismax) {
				el.innerHTML = '<small class="semantic" edsy-text="n-a">N/A</small>';
				el.className = 'error';
			} else if (thmload > heatdismax) {
				var heatlevelBase = getEquilibriumHeatLevel(heatdismax, thmloadBase);
				var time10 = getTimeUntilHeatLevel(heatcap, heatdismax, thmload, heatlevelBase, 1.0);
				if (duration && (time10 > duration)) {
					var heatpct = getHeatLevelAtTime(heatcap, heatdismax, thmload, heatlevelBase, duration) / 1.5;
					el.innerHTML = ('<abbr edsy-vals="' + encodeHTML(JSON.stringify({'number':heatpct,'number#':6,'number%':true})) + '" edsy-title="interp-number" title="' + formatPctText(heatpct, 6) + '">' + formatPctHTML(heatpct, 1) + '</abbr>');
				} else {
					var time15 = (heatcap / 2) / (thmload - heatdismax); // displayed heatlevel 66% -> 100% is actual heatlevel 1.0 -> 1.5
					if (duration && ((time10 + time15) > duration)) {
						var heatpct = (2 + ((duration - time10) / time15)) / 3;
						el.innerHTML = ('<abbr edsy-vals="' + encodeHTML(JSON.stringify({'number':heatpct,'number#':6,'number%':true})) + '" edsy-title="interp-number" title="' + formatPctText(heatpct, 6) + '">' + formatPctHTML(heatpct, 1) + '</abbr>');
					} else if (duration) {
						duration -= time10 + time15;
						var heatlevelPeak = 1.5 + (duration * (thmload - heatdismax) / heatcap);
						var timeCool = (heatlevelPeak - 1.5) / ((heatdismax - thmloadBase) / heatcap);
						el.innerHTML = ('<abbr class="error" edsy-vals="' + encodeHTML(JSON.stringify({'number':(heatlevelPeak/1.5),'number#':1,'number%':true,'seconds':(duration + timeCool),'seconds#':1})) + '" edsy-title="interp-peak-heat-number-overheat-seconds" title="Peak heat level ' + formatPctText(heatlevelPeak / 1.5, 1) + '; over 100% for ' + formatNumText(duration + timeCool, 1) + 's">' + formatTimeHTML(time10 + time15, true) + '</abbr>');
					} else {
						el.innerHTML = formatTimeHTML(time10 + time15, true);
						el.className = 'error';
					}
				}
			} else {
				var heatpct = getEquilibriumHeatLevel(heatdismax, thmload) / 1.5;
				el.innerHTML = ('<abbr edsy-vals="' + encodeHTML(JSON.stringify({'number':heatpct,'number#':6,'number%':true})) + '" edsy-title="interp-number" title="' + formatPctText(heatpct, 6) + '">' + formatPctHTML(heatpct, 1) + '</abbr>');
			}
		} else {
			el.innerHTML = '<small class="semantic" edsy-text="n-a">N/A</small>';
		}
	}; // updateUIStatsThmLevel()


	var updateUIStatsShd = function() {
		// get primary stats
		var shieldrnfps = current.fit.getStat('shieldrnfps');
		var shieldrnfps_ammomax = current.fit.getStat('shieldrnfps_ammomax');
		var powerdist_sys = current.fit.getEffectivePowerDist('sys');
		var slot = current.fit.getSlot('ship', 'hull');
		var mass_hull = slot.getEffectiveAttrValue('mass');
		var slot = current.fit.getSlot('component', CORE_ABBR_SLOT.PD);
		var syscap = slot.getEffectiveAttrValue('syscap');
		var syschg = slot.getEffectiveAttrValue('syschg');
		for (var slotnum = 0;  slot = current.fit.getSlot('internal', slotnum);  slotnum++) {
			if ((slot.getModule() || EMPTY_OBJ).mtype === 'isg' && slot.getPowered())
				break;
		}
		var maxmass = slot ? slot.getEffectiveAttrValue('genmaxmass') : 0;
		var bgenrate = slot ? slot.getEffectiveAttrValue('bgenrate') : 0;
		var genrate = slot ? slot.getEffectiveAttrValue('genrate') : 0;
		var distdraw_mj = slot ? slot.getEffectiveAttrValue('genpwr') : 0;

		// get or compute derived stats
		var hasSG = !!slot;
		var isEnough = (maxmass >= mass_hull);
		var absShdRes = getPipDamageResistance(powerdist_sys) / 100;
		var kinShdRes = current.fit.getStat('_skinres') / 100;
		var thmShdRes = current.fit.getStat('_sthmres') / 100;
		var expShdRes = current.fit.getStat('_sexpres') / 100;
		var cauShdRes = current.fit.getStat('_scaures') / 100;
		var rawShdStr = current.fit.getStat('_shields');
		var ammomaxHTML = formatNumHTML(shieldrnfps_ammomax / shieldrnfps, (shieldrnfps_ammomax % shieldrnfps) ? 1 : 0);
		var powerdistSysMul = pow(powerdist_sys / MAX_POWER_DIST, 1.1);
		var bgenFastTime = min((rawShdStr / 2 / bgenrate), (syscap / max(0, bgenrate * distdraw_mj - syschg * powerdistSysMul)));
		var bgenSlowTime = (rawShdStr / 2 - bgenrate * bgenFastTime) / min(bgenrate, (syschg * powerdistSysMul) / distdraw_mj);
		// TODO: does it really make sense to assume a full cap to start regen from 50-100%?
		//var genFastTime = min((rawShdStr / 2 / genrate), (syscap / max(0, genrate * distdraw_mj - syschg * powerdistSysMul)));
		//var genSlowTime = (rawShdStr / 2 - genrate * genFastTime) / min(genrate, (syschg * powerdistSysMul) / distdraw_mj);
		var genFastTime = 0;
		var genSlowTime = (rawShdStr / 2) / min(genrate, (syschg * powerdistSysMul) / distdraw_mj);

		// update displays
		var htmlNA = '<small class="semantic" edsy-text="n-a">N/A</small>';
		var htmlErrorSG = '<abbr class="error" edsy-title="ui-stats-shield-error-generator" title="Shield Generator has insufficient maximum mass" edsy-text="ui-stats-shield-error-abbr">ERR</abbr>';
		document.getElementById('outfitting_stats_abs_shield_resist').innerHTML = (!hasSG ? htmlNA : (!isEnough ? htmlErrorSG : formatPctHTML(absShdRes, 1)));
		document.getElementById('outfitting_stats_kin_shield_resist').innerHTML = (!hasSG ? htmlNA : (!isEnough ? htmlErrorSG : formatAttrHTML('kinres', kinShdRes * 100)));
		document.getElementById('outfitting_stats_thm_shield_resist').innerHTML = (!hasSG ? htmlNA : (!isEnough ? htmlErrorSG : formatAttrHTML('thmres', thmShdRes * 100)));
		document.getElementById('outfitting_stats_exp_shield_resist').innerHTML = (!hasSG ? htmlNA : (!isEnough ? htmlErrorSG : formatAttrHTML('expres', expShdRes * 100)));
		document.getElementById('outfitting_stats_raw_shield_strength').innerHTML = (!hasSG ? htmlNA : (!isEnough ? htmlErrorSG : formatAttrHTML('shields', rawShdStr, 1)));
		document.getElementById('outfitting_stats_abs_shield_strength').innerHTML = (!hasSG ? htmlNA : (!isEnough ? htmlErrorSG : formatAttrHTML('shields', rawShdStr / (1 - absShdRes), 1)));
		document.getElementById('outfitting_stats_kin_shield_strength').innerHTML = (!hasSG ? htmlNA : (!isEnough ? htmlErrorSG : formatAttrHTML('shields', rawShdStr / (1 - absShdRes) / (1 - kinShdRes), 1)));
		document.getElementById('outfitting_stats_thm_shield_strength').innerHTML = (!hasSG ? htmlNA : (!isEnough ? htmlErrorSG : formatAttrHTML('shields', rawShdStr / (1 - absShdRes) / (1 - thmShdRes), 1)));
		document.getElementById('outfitting_stats_exp_shield_strength').innerHTML = (!hasSG ? htmlNA : (!isEnough ? htmlErrorSG : formatAttrHTML('shields', rawShdStr / (1 - absShdRes) / (1 - expShdRes), 1)));
	//  document.getElementById('outfitting_stats_raw_shield_regen').innerHTML = (!hasSG ? htmlNA : (!isEnough ? htmlErrorSG : formatAttrHTML('genrate', genrate)));
	//  document.getElementById('outfitting_stats_abs_shield_regen').innerHTML = (!hasSG ? htmlNA : (!isEnough ? htmlErrorSG : formatAttrHTML('genrate', genrate / (1 - absShdRes))));
	//  document.getElementById('outfitting_stats_kin_shield_regen').innerHTML = (!hasSG ? htmlNA : (!isEnough ? htmlErrorSG : formatAttrHTML('genrate', genrate / (1 - absShdRes) / (1 - kinShdRes))));
	//  document.getElementById('outfitting_stats_thm_shield_regen').innerHTML = (!hasSG ? htmlNA : (!isEnough ? htmlErrorSG : formatAttrHTML('genrate', genrate / (1 - absShdRes) / (1 - thmShdRes))));
	//  document.getElementById('outfitting_stats_exp_shield_regen').innerHTML = (!hasSG ? htmlNA : (!isEnough ? htmlErrorSG : formatAttrHTML('genrate', genrate / (1 - absShdRes) / (1 - expShdRes))));
		document.getElementById('outfitting_stats_raw_shield_reinf').innerHTML = (!(hasSG && shieldrnfps) ? htmlNA : (!isEnough ? htmlErrorSG : (ammomaxHTML + '<small class="semantic">&times;</small>' + formatAttrHTML('shieldrnfps', shieldrnfps))));
		document.getElementById('outfitting_stats_abs_shield_reinf').innerHTML = (!(hasSG && shieldrnfps) ? htmlNA : (!isEnough ? htmlErrorSG : formatAttrHTML('shieldrnfps', shieldrnfps_ammomax / (1 - absShdRes))));
		document.getElementById('outfitting_stats_kin_shield_reinf').innerHTML = (!(hasSG && shieldrnfps) ? htmlNA : (!isEnough ? htmlErrorSG : formatAttrHTML('shieldrnfps', shieldrnfps_ammomax / (1 - absShdRes) / (1 - kinShdRes))));
		document.getElementById('outfitting_stats_thm_shield_reinf').innerHTML = (!(hasSG && shieldrnfps) ? htmlNA : (!isEnough ? htmlErrorSG : formatAttrHTML('shieldrnfps', shieldrnfps_ammomax / (1 - absShdRes) / (1 - thmShdRes))));
		document.getElementById('outfitting_stats_exp_shield_reinf').innerHTML = (!(hasSG && shieldrnfps) ? htmlNA : (!isEnough ? htmlErrorSG : formatAttrHTML('shieldrnfps', shieldrnfps_ammomax / (1 - absShdRes) / (1 - expShdRes))));
		document.getElementById('outfitting_stats_shield_build').innerHTML = (!hasSG ? htmlNA : (!isEnough ? htmlErrorSG : formatTimeHTML(16 + bgenFastTime + bgenSlowTime)));
		document.getElementById('outfitting_stats_shield_regen').innerHTML = (!hasSG ? htmlNA : (!isEnough ? htmlErrorSG : formatTimeHTML(genFastTime + genSlowTime)));
	}; // updateUIStatsShd();


	var updateUIStatsArm = function() {
		// get primary stats
		var integ_imrp = current.fit.getStat('integ_imrp');
		var dmgprot = current.fit.getStat('dmgprot');
		var lmprepcap_max = current.fit.getStat('lmprepcap_max');
		var cargocap = current.fit.getStat('cargocap');

		var slot = current.fit.getSlot('ship', 'hull');
		var hardness = slot.getEffectiveAttrValue('hardness');

		// get or compute derived stats
		var mrpArmRes = (1 - dmgprot) * 100;
		var kinArmRes = current.fit.getStat('_akinres')
		var thmArmRes = current.fit.getStat('_athmres');
		var expArmRes = current.fit.getStat('_aexpres')
		var cauArmRes = current.fit.getStat('_acaures')
		var rawArmInt = current.fit.getStat('_armour')
		var kinArmInt = (rawArmInt / (1 - kinArmRes / 100));
		var thmArmInt = (rawArmInt / (1 - thmArmRes / 100));
		var expArmInt = (rawArmInt / (1 - expArmRes / 100));
		var cauArmInt = (rawArmInt / (1 - cauArmRes / 100));
		var rawArmRep = lmprepcap_max * cargocap;
		var kinArmRep = (rawArmRep / (1 - kinArmRes / 100));
		var thmArmRep = (rawArmRep / (1 - thmArmRes / 100));
		var expArmRep = (rawArmRep / (1 - expArmRes / 100));
		var cauArmRep = (rawArmRep / (1 - cauArmRes / 100));

		// update displays
		var htmlNA = '<small class="semantic" edsy-text="n-a">N/A</small>';
		document.getElementById('outfitting_stats_raw_armour_hardness').innerHTML = formatNumHTML(hardness, 0);
		document.getElementById('outfitting_stats_mod_armour_protect').innerHTML = (integ_imrp ? formatAttrHTML('dmgprot', mrpArmRes) : htmlNA);
		document.getElementById('outfitting_stats_kin_armour_resist').innerHTML = formatAttrHTML('kinres', kinArmRes);
		document.getElementById('outfitting_stats_thm_armour_resist').innerHTML = formatAttrHTML('thmres', thmArmRes);
		document.getElementById('outfitting_stats_exp_armour_resist').innerHTML = formatAttrHTML('expres', expArmRes);
		document.getElementById('outfitting_stats_cau_armour_resist').innerHTML = formatAttrHTML('caures', cauArmRes);
		document.getElementById('outfitting_stats_raw_armour_integ').innerHTML = formatNumHTML(rawArmInt, 1);
		document.getElementById('outfitting_stats_mod_armour_integ').innerHTML = (integ_imrp ? formatNumHTML(integ_imrp, 1) : htmlNA);
		document.getElementById('outfitting_stats_kin_armour_integ').innerHTML = formatNumHTML(kinArmInt, 1);
		document.getElementById('outfitting_stats_thm_armour_integ').innerHTML = formatNumHTML(thmArmInt, 1);
		document.getElementById('outfitting_stats_exp_armour_integ').innerHTML = formatNumHTML(expArmInt, 1);
		document.getElementById('outfitting_stats_cau_armour_integ').innerHTML = formatNumHTML(cauArmInt, 1);
		document.getElementById('outfitting_stats_raw_armour_repair').innerHTML = (rawArmRep ? formatNumHTML(rawArmRep, 1) : htmlNA);
		document.getElementById('outfitting_stats_kin_armour_repair').innerHTML = (rawArmRep ? formatNumHTML(kinArmRep, 1) : htmlNA);
		document.getElementById('outfitting_stats_thm_armour_repair').innerHTML = (rawArmRep ? formatNumHTML(thmArmRep, 1) : htmlNA);
		document.getElementById('outfitting_stats_exp_armour_repair').innerHTML = (rawArmRep ? formatNumHTML(expArmRep, 1) : htmlNA);
		document.getElementById('outfitting_stats_cau_armour_repair').innerHTML = (rawArmRep ? formatNumHTML(cauArmRep, 1) : htmlNA);
	}; // updateUIStatsArm()


	var updateUIStatsWpn = function() {
		// get primary stats
		var dps = current.fit.getStat('dps');
		var dps_abs = current.fit.getStat('dps_abs');
		var dps_thm = current.fit.getStat('dps_thm');
		var dps_kin = current.fit.getStat('dps_kin');
		var dps_exp = current.fit.getStat('dps_exp');
		var dps_axe = current.fit.getStat('dps_axe');
		var dps_cau = current.fit.getStat('dps_cau');
		var dps_nodistdraw = current.fit.getStat('dps_nodistdraw');
		var dps_distdraw = current.fit.getStat('dps_distdraw');
		var ammotime_wepcap = current.fit.getStat('ammotime_wepcap');
		var ammotime_nocap = current.fit.getStat('ammotime_nocap');
		var wepcap_burst_cur = current.fit.getStat('wepcap_burst_cur');
		var wepcap_burst_max = current.fit.getStat('wepcap_burst_max');
		var wepchg_sustain_cur = current.fit.getStat('wepchg_sustain_cur');
		var wepchg_sustain_max = current.fit.getStat('wepchg_sustain_max');

		// compute derived stats
		var curWpnSus = ((dps_nodistdraw + (dps_distdraw ? (dps_distdraw * wepchg_sustain_cur) : 0)) / dps);
		var maxWpnSus = ((dps_nodistdraw + (dps_distdraw ? (dps_distdraw * wepchg_sustain_max) : 0)) / dps);
		var ammWpnDur = min(ammotime_nocap, ((ammotime_wepcap <= wepcap_burst_max) ? ammotime_wepcap : (wepcap_burst_max + (ammotime_wepcap - wepcap_burst_max) / maxWpnSus)));

		// update displays
		var htmlNA = '<small class="semantic" edsy-text="n-a">N/A</small>';
		document.getElementById('outfitting_stats_wpn_raw_burst').innerHTML = (dps ? formatAttrHTML('dps', dps, 1) : htmlNA);
		document.getElementById('outfitting_stats_wpn_abs_burst').innerHTML = (dps ? formatPctHTML(dps_abs / dps, 0) : htmlNA);
		document.getElementById('outfitting_stats_wpn_thm_burst').innerHTML = (dps ? formatPctHTML(dps_thm / dps, 0) : htmlNA);
		document.getElementById('outfitting_stats_wpn_kin_burst').innerHTML = (dps ? formatPctHTML(dps_kin / dps, 0) : htmlNA);
		document.getElementById('outfitting_stats_wpn_exp_burst').innerHTML = (dps ? formatPctHTML(dps_exp / dps, 0) : htmlNA);
		document.getElementById('outfitting_stats_wpn_axe_burst').innerHTML = (dps ? formatPctHTML(dps_axe / dps, 0) : htmlNA);
		document.getElementById('outfitting_stats_wpn_cur_dur').innerHTML = (dps ? formatTimeHTML(wepcap_burst_cur) : htmlNA);
		document.getElementById('outfitting_stats_wpn_max_dur').innerHTML = (dps ? formatTimeHTML(wepcap_burst_max) : htmlNA);
		document.getElementById('outfitting_stats_wpn_amm_dur').innerHTML = (dps ? formatTimeHTML(ammWpnDur) : htmlNA);
		document.getElementById('outfitting_stats_wpn_cur_sus').innerHTML = (dps ? formatPctHTML(curWpnSus, 1) : htmlNA);
		document.getElementById('outfitting_stats_wpn_max_sus').innerHTML = (dps ? formatPctHTML(maxWpnSus, 1) : htmlNA);
	}; // updateUIStatsWpn()


	/*
	* OPTIONS UI
	*/


	var initUIOptions = function() {
		var rows = document.getElementById('options_insurance').getElementsByTagName('DD');
		for (var i = 0;  i < rows.length;  i++) {
			var input = rows[i].getElementsByTagName('INPUT')[0];
			var span = rows[i].getElementsByTagName('SPAN')[0];
			span.innerText = span.innerText.replace(/[0-9\.]+ *%/, formatPctText(parseFloat(input.value) / 10000, 1));
		}

		var container = document.getElementById('options_discounts_bits');
		while (container.lastElementChild)
			cache.template.options_discounts_bits_label = container.removeChild(container.lastElementChild);
		for (var i = 0;  i <= DISCOUNTS.length;  i++) {
			var bit = min(1 << i, 0x3F);
			var label = cache.template.options_discounts_bits_label.cloneNode(true);
			label.getElementsByTagName('INPUT')[0].value = bit;
			if (bit == 0x3F) {
				label.getElementsByTagName('DIV')[0].replaceChildren(createTranslatedElement('span', 'ui-options-discounts-free'));
			} else {
				label.getElementsByTagName('DIV')[0].innerHTML = formatPctHTML(1 - cache.discountMod[bit], (DISCOUNTS[DISCOUNTS.length - 1 - i] % 1 ? 1 : 0));
			}
			container.appendChild(label);
			container.appendChild(document.createTextNode(' '));
		}

		var divBuiltinHardpoints = document.getElementById('options_builtin_hardpoints');
		divBuiltinHardpoints.replaceChildren();
		var divBuiltinOther = document.getElementById('options_builtin_other');
		divBuiltinOther.replaceChildren();
		for (var g = 0;  g < GROUPS.length;  g++) {
			var group = GROUPS[g];
			for (var t = 0;  t < (cache.groupMtypes[group] || EMPTY_ARR).length;  t++) {
				var mtype = cache.groupMtypes[group][t];
				for (var b = 0;  b < (cache.mtypeBuiltins[mtype] || EMPTY_ARR).length;  b++) {
					var bmodid = cache.mtypeBuiltins[mtype][b];
					var label = document.createElement('label');
					label.id = 'options_builtin_' + bmodid;
					label.className = "checkbox left";
					var input = document.createElement('input');
					input.type = 'checkbox';
					input.name = 'builtin' + bmodid;
					input.disabled = (BUILTIN_STORED_MODULES[bmodid].tag !== 'C');
					label.appendChild(input);
					var divWrapper = document.createElement('div');
					var divCheck = document.createElement('div');
					divCheck.className = "check";
					divWrapper.appendChild(divCheck);
					var span = document.createElement('span');
					span.append(
						createIcon(ICON_TAG[BUILTIN_STORED_MODULES[bmodid].tag]),
						' ',
						BUILTIN_STORED_MODULES[bmodid].name // TODO translation
					);
					divWrapper.appendChild(span);
					label.appendChild(divWrapper);
					((group === 'hardpoint') ? divBuiltinHardpoints : divBuiltinOther).appendChild(label);
				}
			}
		}

		var select = document.forms.options.elements.language;
		for (var l = 0;  l < LANGS.length;  l++) {
			var option = document.createElement('option');
			option.value = LANGS[l];
			option.append(
				LANG_NAMES[LANGS[l]],
				' (',
				createTranslatedElement('span', 'language-'+LANGS[l]),
				')'
			);
			select.options.add(option);
		}
	}; // initUIOptions()


	var sortUIOptionsBuiltins = function() {
		var divBuiltinHardpoints = document.getElementById('options_builtin_hardpoints');
		var divBuiltinOther = document.getElementById('options_builtin_other');
		for (var g = 0;  g < GROUPS.length;  g++) {
			var group = GROUPS[g];
			for (var t = 0;  t < (cache.groupMtypes[group] || EMPTY_ARR).length;  t++) {
				var mtype = cache.groupMtypes[group][t];
				for (var b = 0;  b < (cache.mtypeBuiltins[mtype] || EMPTY_ARR).length;  b++) {
					var bmodid = cache.mtypeBuiltins[mtype][b];
					var label = document.getElementById('options_builtin_' + bmodid);
					((group === 'hardpoint') ? divBuiltinHardpoints : divBuiltinOther).appendChild(label);
				}
			}
		}
	}; // sortUIOptionsBuiltins()


	var updateUIOptions = function() {
		// validate options settings
		current.option.insurance = parseInt(current.option.insurance);
		current.option.discounts = min(max(parseInt(current.option.discounts), 0), 0x3F);
		if (!{none:1,some:1,all:1}[current.option.builtin])
			current.option.builtin = 'some';
		for (var bmodid in BUILTIN_STORED_MODULES) {
			var opt = 'builtin' + bmodid;
			current.option[opt] = !!current.option[opt];
		}
		if (!{none:1,some:1,all:1}[current.option.onlybest])
			current.option.onlybest = 'none';
		current.option.revsize = !!current.option.revsize;
		current.option.revrating = !!current.option.revrating;
		current.option.experimental = !!current.option.experimental;
		current.option.show1 = !!current.option.show1;
		current.option.show2 = !!current.option.show2;
		current.option.show3 = !!current.option.show3;
		current.option.hidestats = !!current.option.hidestats;
		for (var i = 0;  i < CSS_FONTS.length;  i++) {
			var teststyle = new Option().style;
			var opt = 'font' + CSS_FONTS[i];
			if (current.option[opt].trim() === cache.option[opt] || !(teststyle.font = current.option[opt]) || !teststyle.font)
				current.option[opt] = '';
		}
		current.option.colorinvert = !!current.option.colorinvert;
		for (var i = 0;  i < CSS_COLORS.length;  i++) {
			for (var n = 1;  n <= 5;  n++) {
				var teststyle = new Option().style;
				var opt = 'color' + CSS_COLORS[i] + n;
				if (current.option[opt].trim() === cache.option[opt] || !(teststyle.color = current.option[opt]) || !teststyle.color)
					current.option[opt] = '';
			}
		}
		if (!LANG_NAMES[current.option.language])
			current.option.language = '';

		// apply options settings
		document.body.classList.toggle('mostlybest', current.option.onlybest == 'some');
		document.body.classList.toggle('onlybest', current.option.onlybest == 'all');
		// revsize,revrating are handled by initUIModulePicker()
		document.body.classList.toggle('experimental', !!current.option.experimental);
		document.body.classList.toggle('show1', !!current.option.show1);
		document.body.classList.toggle('show2', !!current.option.show2);
		document.body.classList.toggle('show3', !!current.option.show3);
		var docstyle = document.documentElement.style;
		for (var i = 0;  i < CSS_FONTS.length;  i++) {
			var opt = 'font' + CSS_FONTS[i];
			docstyle.setProperty('--'+opt, current.option[opt] || cache.option[opt]);
		}
		docstyle.setProperty('--colorblack', (current.option.colorinvert ? 'white' : 'black'));
		docstyle.setProperty('--colorwhite', (current.option.colorinvert ? 'black' : 'white'));
		for (var n = 1;  n <= 5;  n++) {
			docstyle.setProperty('--colorgrey'+n, (current.option.colorinvert ? cache.option['colorgrey'+(6-n)] : cache.option['colorgrey'+n]));
		}
		for (var i = 0;  i < CSS_COLORS.length;  i++) {
			for (var n = 1;  n <= 5;  n++) {
				var opt = 'color' + CSS_COLORS[i] + n;
				docstyle.setProperty('--'+opt, current.option[opt] || cache.option[opt]);
			}
		}
		current.lang = current.option.language || (current.locale ? current.locale.substr(0,2) : undefined);
		if (!LANG_NAMES[current.lang])
			current.lang = LANG_DEFAULT;

		// update options controls
		var elements = document.forms.options.elements;
		elements.insurance.value = current.option.insurance;
		var inputs = document.getElementById('options_discounts_bits').getElementsByTagName('INPUT');
		for (var i = 0;  i < inputs.length;  i++) {
			if (inputs[i].name === 'discount') {
				var bit = parseInt(inputs[i].value);
				inputs[i].checked = (((current.option.discounts & bit) == bit) && ((current.option.discounts == 0x3F) == (bit == 0x3F)));
			}
		}
		elements.builtin.value = current.option.builtin;
		for (var bmodid in BUILTIN_STORED_MODULES) {
			var opt = 'builtin' + bmodid;
			elements[opt].checked = (BUILTIN_STORED_MODULES[bmodid].tag !== 'C') || current.option[opt];
		}
		document.getElementById('options_builtin').style.display = ((current.option.builtin === 'some') ? '' : 'none');
		elements.onlybest.value = current.option.onlybest;
		elements.revsize.checked = current.option.revsize;
		elements.revrating.checked = current.option.revrating;
		elements.experimental.checked = current.option.experimental;
		elements.show1.checked = current.option.show1;
		elements.show2.checked = current.option.show2;
		elements.show3.checked = current.option.show3;
		elements.hidestats.checked = current.option.hidestats;
		for (var i = 0;  i < CSS_FONTS.length;  i++) {
			var opt = 'font' + CSS_FONTS[i];
			elements[opt].value = current.option[opt] || cache.option[opt];
		}
		elements.colorinvert.checked = current.option.colorinvert;
		for (var i = 0;  i < CSS_COLORS.length;  i++) {
			for (var n = 1;  n <= 5;  n++) {
				var opt = 'color' + CSS_COLORS[i] + n;
				elements[opt].value = current.option[opt] || cache.option[opt];
			}
		}
		elements.language.value = current.option.language;
	}; // updateUIOptions()


	/*
	* UI EVENT HANDLERS
	*/


	var onWindowResize = function(e) {
		if (current.resize)
			clearTimeout(current.resize);
		current.resize = setTimeout(onWindowResizeTimeout, TIMEOUT_RESIZE);
		updateUIFullscreen();
	}; // onWindowResize()


	var onWindowResizeTimeout = function() {
		if (current.resize) {
			clearTimeout(current.resize);
			current.resize = null;
		}
		updateUILayout();
		updateUIStatsPanels();
	}; // onWindowResizeTimeout()


	var onBodyClickCapture = function(e) {
		var input;
		// if any popout is open, and we didn't click inside it, close it
		var popouts = document.getElementsByClassName('popout');
		var p = popouts.length;
		while (p--) {
			for (input = popouts[p].firstChild;  input && (!input.classList || !input.classList.contains('toggleinput'));  input = input.nextSibling)
				;
			if (input && input.checked && !popouts[p].contains(e.target))
				input.checked = false;
		}
	}; // onBodyClickCapture()


	var onDocumentClickFocus = function(e) {
		if (!current.popup.element)
			return;
		var el = e.target;
		while (el && (el !== current.popup.element && el !== current.popup.trigger))
			el = el.parentNode;
		if (!el) {
			if (current.popup.refocus) {
				e.preventDefault();
				current.popup.refocus.focus();
				if (current.popup.refocus.select)
					current.popup.refocus.select();
			} else {
				hideUIPopup();
			}
		}
	}; // onDocumentClickFocus()


	var onDocumentDragEnter = function(e) {
		if (contains(e.dataTransfer.types, 'Files')) {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'copy';
		}
	}; // onDocumentDragEnter()


	var onDocumentDragOver = function(e) {
		if (contains(e.dataTransfer.types, 'Files')) {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'copy';
		}
	}; // onDocumentDragOver()


	var onDocumentDrop = function(e) {
		var file = e.dataTransfer.files[0]; // TODO: handle multiple files
		if (file) {
			e.stopPropagation();
			e.preventDefault();
			var reader = new FileReader();
			reader.addEventListener('load', onDocumentDrop_FilereaderLoad);
			reader.readAsText(file);
		}
	}; // onDocumentDrop()


	var onDocumentDrop_FilereaderLoad = function(e) {
		hideUIPopup();
		importData(e.target.result);
	}; // onDocumentDrop_FilereaderLoad()


	var onUIModalKeydownCapture = function(e) {
		if ((e.key === 'Escape') || ((e.keyCode || e.which) === 27)) {
			e.preventDefault();
			if (current.popup.sticky) {
				var onCancel = current.popup.onCancel;
				if (typeof onCancel === 'function')
					onCancel(null);
			} else {
				var trigger = current.popup.trigger;
				hideUIPopup();
				if (trigger)
					trigger.focus();
			}
		}
	}; // onUIModalKeydownCapture()


	var onUIModalClick = function(e) {
		var el = e.target;
		while (el && el.tagName !== 'DIV')
			el = el.parentNode;
		if (el === e.currentTarget) {
			if (current.popup.sticky) {
				e.preventDefault();
				if (current.popup.refocus) {
					current.popup.refocus.focus();
					if (current.popup.refocus.select)
						current.popup.refocus.select();
				}
			} else {
				hideUIPopup();
			}
		}
	}; // onUIModalClick()


	var onUIPopupButtonClick = function(e) {
		e.preventDefault();
		var trigger = current.popup.trigger;
		var onOkay = current.popup.onOkay;
		var onCancel = current.popup.onCancel;
		var value = document.forms.popup.elements.textbox.value;
		hideUIPopup();
		if (trigger)
			trigger.focus();
		if (e.target.name === 'okay') {
			if (typeof onOkay === 'function')
				onOkay(value);
		} else if (e.target.name === 'cancel') {
			if (typeof onCancel === 'function')
				onCancel(value);
		}
	}; // onUIPopupButtonClick()


	var onUIPopupImportButtonClick = function(e) {
		e.preventDefault();
		switch (e.currentTarget.name) {
		case 'import_ignore':
		case 'import_save':
		case 'import_saveas':
			var action = e.currentTarget.name.split('_')[1];
			var el;
			for (var i = 0;  el = document.getElementById('import_store_'+i+'_'+action);  i++) {
				if (!el.disabled)
					el.checked = true;
			}
			e.stopPropagation();
			return false;

		case 'import_load_none':
			var i = document.forms.popup.elements.import_load.value;
			var el = document.getElementById('import_load_' + i);
			if (el)
				el.checked = false;
			e.stopPropagation();
			return false;
		}
		return true;
	}; // onUIPopupImportButtonClick()


	var onUIPopupExportFieldFocus = function(e) {
		if (e.target.select)
			e.target.select();
	}; // onUIPopupExportFieldFocus()


	var onUIPopupExportCopyButtonClick = function(e) {
		e.preventDefault();
		e.stopPropagation();
		var tr = e.target;
		while (tr && tr.tagName !== 'TR')
			tr = tr.parentNode;
		if (tr) {
			var inputs = tr.getElementsByTagName('INPUT');
			var textareas = tr.getElementsByTagName('TEXTAREA');
			var el = inputs[0] || textareas[0];
			if (el && el.focus && el.select) {
				el.focus();
				el.select();
				try {
					document.execCommand('copy');
				} catch (exc) {
				}
			}
		}
	}; // onUIPopupExportCopyButtonClick()


	var onUIMaximizeButtonClick = function(e) {
		if (cache.feature.requestFullscreen && cache.feature.cancelFullscreen) {
			cache.feature.requestFullscreen.call(window.document.documentElement);
		}
	}; // onUIMaximizeButtonClick()


	var onUIMinimizeButtonClick = function(e) {
		if (cache.feature.cancelFullscreen) {
			cache.feature.cancelFullscreen.call(window.document);
		}
	}; // onUIMinimizeButtonClick()


	var onUIPageHeaderChange = function(e) {
		setUIPageTab(e.target.value);
	}; // onUIPageHeaderChange()


	var onUIQueryMouseDown = function(e) {
		e.preventDefault();
		e.stopPropagation();
		document.addEventListener('mousemove', onUIQueryMouseMove, true);
		document.addEventListener('mouseup', onUIQueryMouseUp, true);
		startQueryDrag(e.clientX, e.clientY);
	}; // onUIQueryMouseDown()


	var onUIQueryMouseMove = function(e) {
		updateQueryPosition(e.clientX, e.clientY);
	}; // onUIQueryMouseMove()


	var onUIQueryMouseUp = function(e) {
		document.removeEventListener('mousemove', onUIQueryMouseMove, true);
		document.removeEventListener('mouseup', onUIQueryMouseUp, true);
		stopQueryDrag();
	}; // onUIQueryMouseUp()


	var onUIQueryTouchStart = function(e) {
		e.stopPropagation();
		if (e.touches.length >= 1) {
			document.addEventListener('touchmove', onUIQueryTouchMove, true);
			document.addEventListener('touchend', onUIQueryTouchEnd, true);
			document.addEventListener('touchcancel', onUIQueryTouchCancel, true);
			startQueryDrag(e.touches[0].clientX, e.touches[0].clientY);
		}
	}; // onUIQueryTouchStart()


	var onUIQueryTouchMove = function(e) {
		if (current.query && e.touches.length >= 1) {
			updateQueryPosition(e.touches[0].clientX, e.touches[0].clientY);
		} else {
			return onUIQueryTouchEnd(e);
		}
	}; // onUIQueryTouchMove()


	var onUIQueryTouchEnd = function(e) {
		document.removeEventListener('touchmove', onUIQueryTouchMove, true);
		document.removeEventListener('touchend', onUIQueryTouchEnd, true);
		document.removeEventListener('touchcancel', onUIQueryTouchCancel, true);
		stopQueryDrag();
	}; // onUIQueryTouchEnd()


	var onUIQueryTouchCancel = function(e) {
		return onUIQueryTouchEnd(e);
	}; // onUIQueryTouchCancel()


	var startQueryDrag = function(cx, cy) {
		var glow = document.getElementById('query_glow');
		glow.style.display = 'none';
		var query = document.getElementById('query_tool');
		query.style.position = 'absolute';
		var info = document.getElementById('query_info');
		info.style.display = 'none';
		updateQueryPosition(cx, cy);
	}; // startQueryDrag()


	var updateQueryPosition = function(cx, cy) {
		var query = document.getElementById('query_tool');
		query.style.top = parseInt(cy - query.offsetHeight / 2) + 'px';
		query.style.left = parseInt(cx - query.offsetWidth / 2) + 'px';
		if (!current.query) {
			current.query = {};
		}
		current.query.x = cx;
		current.query.y = cy;
		if (!current.query.timeout) {
			current.query.timeout = setTimeout(updateQueryPositionTimeout, 50);
		}
	}; // updateQueryPosition()


	var updateQueryPositionTimeout = function() {
		if (!current.query) return;
		current.query.timeout = null;
		var cx = current.query.x;
		var cy = current.query.y;

		var glow = document.getElementById('query_glow');
		var info = document.getElementById('query_info');
		var els = document.elementsFromPoint(cx, cy);
		for (var e = 0;  e < els.length;  e++) {
			if (els[e].tagName === 'ABBR' && els[e].id !== 'query_tool') {
				var rect = els[e].getBoundingClientRect();
				glow.style.left = (rect.left + window.scrollX) + 'px';
				glow.style.top = (rect.top + window.scrollY) + 'px';
				glow.style.width = rect.width + 'px';
				glow.style.height = rect.height + 'px';
				glow.style.display = 'block';
				if (cx < document.documentElement.clientWidth / 2) {
					info.style.left = '80%';
					info.style.right = '';
				} else {
					info.style.left = '';
					info.style.right = '80%';
				}
				if (cy < document.documentElement.clientHeight / 2) {
					info.style.top = '80%';
					info.style.bottom = '';
				} else {
					info.style.top = '';
					info.style.bottom = '80%';
				}
				info.innerHTML = (els[e].id !== 'query_start' ? ('<b>' + els[e].innerText + '</b>: ') : '') + els[e].title;
				info.style.display = 'block';
				return;
			}
		}
		glow.style.display = 'none';
		info.style.display = 'none';
	}; // updateQueryPositionTimeout()


	var stopQueryDrag = function() {
		current.query = null;
		var glow = document.getElementById('query_glow');
		glow.style.display = 'none';
		var query = document.getElementById('query_tool');
		query.style.position = 'static';
		var info = document.getElementById('query_info');
		info.style.display = 'none';
	}; // stopQueryDrag()


	var onUIContextMenu = function(e) {
		e.preventDefault();
		e.stopPropagation();
		return false;
	}; // onUIContextMenu()


	var onUIModuleTabChange = function(e) {
		if (e.target.name === 'tab' && e.target.checked) {
			setUIModuleTab(e.target.value);
		}
	}; // onUIModuleTabChange()


	var onUIModulePickerChange = function(e) {
		if (e.target.name === 'module' && e.target.checked) {
			var tokens = e.target.value.split('.');
			var modid = tokens[0] | 0;
			var namehash = tokens[1];
			setUIOutfittingFocus('module');
			setUIPickerModule(modid, namehash, false);
			updateUIDetailsStoredModules();
			updateUIDetailsStoredModuleControls(true, namehash);
			updateUIDetailsModule();
		}
	}; // onUIModulePickerChange()


	var onUIModulePickerClick = function(e) {
		var el = e.target;
		while (el && el.tagName !== 'LABEL' && el.tagName !== 'INPUT') {
			el = el.parentNode;
		}
		if (!el) {
		} else if (el.tagName === 'LABEL') {
			var inputs = el.getElementsByTagName('INPUT');
			if (inputs.length > 0 && inputs[0].name === 'module') {
				var modtag = inputs[0].value;
				var tokens = modtag.split('.');
				var modid = tokens[0] | 0;
				var namehash = tokens[1];
				if (!current.pickerClick[modtag]) { // single
					current.pickerClick[modtag] = setTimeout(onUIModulePickerClickTimeout, TIMEOUT_DBLCLICK, modtag);
					if (inputs[0].checked && current.outfitting_focus !== 'module') {
						setUIOutfittingFocus('module');
						updateUIDetailsStoredModules();
						updateUIDetailsStoredModuleControls(true, namehash);
						updateUIDetailsModule();
					}
				} else { // double
					clearTimeout(current.pickerClick[modtag]);
					delete current.pickerClick[modtag];
					setCurrentFitSlotModule(current.group, current.slot, modid, namehash);
					setUIOutfittingPanels('slots',  'modules', 'slots');
				}
			}
		}
	}; // onUIModulePickerClick()


	var onUIModulePickerClickTimeout = function(modtag) {
		if (current.pickerClick[modtag]) {
			clearTimeout(current.pickerClick[modtag]);
			delete current.pickerClick[modtag];
			var tokens = modtag.split('.');
			var modid = tokens[0] | 0;
			var namehash = tokens[1];
			if (modid || namehash) {
				setUIOutfittingPanels('details');
			}
		}
	}; // onUIModulePickerClickTimeout()


	var onUIModulePickerDblClick = function(e) {
		var el = e.target;
		while (el && el.tagName !== 'LABEL' && el.tagName !== 'INPUT') {
			el = el.parentNode;
		}
		if (!el) {
		} else if (el.tagName === 'LABEL') {
			e.preventDefault();
			return false;
		}
	}; // onUIModulePickerDblClick()


	var onUIModulePickerLabelTouchStart = function(e) {
		e.stopPropagation();
		var label = e.currentTarget;
		var inputID = label.htmlFor;
		var touchdata = current.pickerTouch[inputID];
		if (e.touches.length !== 1) {
			return onUIModulePickerLabelTouchCancel(e);
		}
		if (touchdata) {
			clearTimeout(touchdata.timeout);
		} else {
			current.pickerTouch[inputID] = touchdata = { timeout:null, x:0, y:0 };
		}
		touchdata.timeout = setTimeout(onUIModulePickerLabelTouchTimeout, TIMEOUT_LONGPRESS, inputID);
		touchdata.x = e.touches[0].screenX;
		touchdata.y = e.touches[0].screenY;
		label.classList.add('active');
		label.addEventListener('touchmove', onUIModulePickerLabelTouchMove);
		label.addEventListener('touchend', onUIModulePickerLabelTouchEnd);
		label.addEventListener('touchcancel', onUIModulePickerLabelTouchCancel);
		return true;
	}; // onUIModulePickerLabelTouchStart()


	var onUIModulePickerLabelTouchMove = function(e) {
		e.stopPropagation();
		var label = e.currentTarget;
		var inputID = label.htmlFor;
		var touchdata = current.pickerTouch[inputID];
		if (!touchdata || e.touches.length !== 1 || abs(e.touches[0].screenX - touchdata.x) > TOLERANCE_TOUCH || abs(e.touches[0].screenY - touchdata.y) > TOLERANCE_TOUCH) {
			return onUIModulePickerLabelTouchCancel(e);
		}
		if (e.cancelable)
			e.preventDefault();
		return false;
	}; // onUIModulePickerLabelTouchMove()


	var onUIModulePickerLabelTouchEnd = function(e) {
		var label = e.currentTarget;
		var inputID = label.htmlFor;
		var touchdata = current.pickerTouch[inputID];
		onUIModulePickerLabelTouchCancel(e);
		if (!touchdata || e.touches.length > 0 || e.changedTouches.length !== 1 || abs(e.changedTouches[0].screenX - touchdata.x) > TOLERANCE_TOUCH || abs(e.changedTouches[0].screenY - touchdata.y) > TOLERANCE_TOUCH) {
			return true;
		}
		var input = document.getElementById(inputID);
		if ((input && !input.checked) || current.outfitting_focus !== 'module') {
			var tokens = input.value.split('.');
			var modid = tokens[0] | 0;
			var namehash = tokens[1];
			setUIOutfittingFocus('module');
			if (input && !input.checked)
				setUIPickerModule(modid, namehash, false);
			updateUIDetailsStoredModules();
			updateUIDetailsStoredModuleControls(true, namehash);
			updateUIDetailsModule();
		}
		setUIOutfittingPanels('details');
		if (e.cancelable)
			e.preventDefault();
		return false;
	}; // onUIModulePickerLabelTouchEnd()


	var onUIModulePickerLabelTouchCancel = function(e, label) {
		if (e) {
			e.stopPropagation();
			label = e.currentTarget;
		}
		var inputID = label.htmlFor;
		var touchdata = current.pickerTouch[inputID];
		if (touchdata) {
			clearTimeout(touchdata.timeout);
			delete current.pickerTouch[inputID];
		}
		label.classList.remove('active');
		label.removeEventListener('touchmove', onUIModulePickerLabelTouchMove);
		label.removeEventListener('touchend', onUIModulePickerLabelTouchEnd);
		label.removeEventListener('touchcancel', onUIModulePickerLabelTouchCancel);
		return true;
	}; // onUIModulePickerLabelTouchCancel()


	var onUIModulePickerLabelTouchTimeout = function(inputID) {
		var input = document.getElementById(inputID);
		var label = input.parentNode;
		var touchdata = current.pickerTouch[inputID];
		onUIModulePickerLabelTouchCancel(null, label);
		if (!touchdata) {
			return true;
		}
		var tokens = input.value.split('.');
		var modid = tokens[0] | 0;
		var namehash = tokens[1];
		setCurrentFitSlotModule(current.group, current.slot, modid, namehash);
		setUIOutfittingPanels('slots',  'modules', 'slots');
		return false;
	}; // onUIModulePickerLabelTouchTimeout()


	var onUIModuleButtonsClick = function(e) {
		var el = e.target;
		while (el && el.tagName !== 'BUTTON')
			el = el.parentNode;
		if (!el || el.disabled) {
		} else if (el.name === 'back') {
			if (current.outfitting_focus === 'slot') {
				setUIOutfittingPanels('details',  'modules', 'slots');
			} else if (current.outfitting_focus === 'module') {
				setUIOutfittingPanels('slots',  'modules', 'slots');
			}
		} else if (el.name === 'details') {
			if (current.outfitting_focus === 'slot') {
				setUIOutfittingPanels('details',  'slots', 'details');
			} else if (current.outfitting_focus === 'module') {
				setUIOutfittingPanels('details',  'modules', 'details');
			}
		}
	}; // onUIModuleButtonsClick()


	var onUIModulePickerDragStart = function(e) {
		if (e.target && e.target.tagName === 'LABEL') {
			var inputs = e.target.getElementsByTagName('INPUT');
			var tokens = inputs[0].value.split('.');
			var modid = tokens[0] | 0;
			var namehash = tokens[1];
			// TODO: ghost bug in chrome
			e.dataTransfer.setData('edsy/mid', modid | 0);
			e.dataTransfer.setData('edsy/namehash', namehash || '');
			e.dataTransfer.effectAllowed = 'copy';
			setCurrentDrag(modid, namehash);
		}
	}; // onUIModulePickerDragStart()


	var onUIModulePickerDragEnd = function(e) {
		setCurrentDrag();
	}; // onUIModulePickerDragEnd()


	var onUIModulePickerDragEnter = function(e) {
		if (contains(e.dataTransfer.types, 'edsy/slot')) {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'move';
			// TODO: .dragready highlighting?
		} else {
			onDocumentDragEnter(e);
		}
	}; // onUIModulePickerDragEnter()


	var onUIModulePickerDragOver = function(e) {
		if (contains(e.dataTransfer.types, 'edsy/slot')) {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'move';
		} else {
			onDocumentDragOver(e);
		}
	}; // onUIModulePickerDragOver()


	var onUIModulePickerDragLeave = function(e) {
		// TODO: .dragready highlighting?
	}; // onUIModulePickerDragLeave()


	var onUIModulePickerDrop = function(e) {
		var group = e.dataTransfer.getData('edsy/group');
		var slot = e.dataTransfer.getData('edsy/slot');
		if (group) {
			e.preventDefault();
			e.stopPropagation();
			setCurrentFitSlotModule(group, slot, 0);
		} else {
			onDocumentDrop(e);
		}
	}; // onUIModulePickerDrop()


	var onUIFitSettingsStoredClick = function(e) {
		var el = e.target;
		while (el && el.tagName !== 'BUTTON')
			el = el.parentNode;
		if (!el || el.disabled)
			return;

		e.preventDefault();
		var namehash = document.forms.fit.elements.outfitting_fit_stored.value;
		switch (el.id) {
		case 'outfitting_fit_stored_reload':
			setCurrentFitNameHash(namehash);
			break;

		case 'outfitting_fit_stored_save':
			saveCurrentStoredBuild(false);
			break;

		case 'outfitting_fit_stored_saveas':
			saveCurrentStoredBuild(true);
			break;

		case 'outfitting_fit_stored_rename':
			renameStoredBuild(namehash);
			break;

		case 'outfitting_fit_stored_delete':
			deleteStoredBuild(namehash);
			break;

		default:
			console.log('onUIFitSettingsStoredClick({target.id="'+el.id+'"})');
		}
	}; // onUIFitSettingsStoredClick()


	var onUIFitSettingsStoredChange = function(e) {
		if (e.target.name === 'outfitting_fit_stored') {
			var inaraAcct = current.fit.inaraAcct;
			var inaraShip = current.fit.inaraShip;
			var inaraURL = current.fit.getInaraBuildURL();
			if (setCurrentFitNameHash(e.target.value)) {
				if (current.fit.setInaraXref(inaraAcct, inaraShip) && inaraURL) {
					// TODO: not like this :X
					document.getElementById('fit_header_export').style.display = (inaraURL ? '' : 'none');
					document.forms.fit.elements.export_inara.style.display = (inaraURL ? '' : 'none');
				}
			}
		}
	}; // onUIFitSettingsStoredChange()


	var onUIFitSettingsColsChange = function(e) {
		updateUIFitColumns();
		// let the changes finish rendering
		setTimeout(updateUILayout, 1);
	}; // onUIFitSettingsColsChange()


	var onUIFitSettingsOpsClick = function(e) {
		var el = e.target;
		while (el && el.tagName !== 'BUTTON')
			el = el.parentNode;
		if (!el || el.disabled)
			return;

		e.preventDefault();
		document.getElementById('outfitting_ops_toggle').checked = false;
		switch (el.id) {
		case 'outfitting_fit_import':
			showUIImportPopup();
			break;

		case 'outfitting_fit_export':
			showUIExportPopup();
			break;

		case 'outfitting_fit_discounts':
			var discounts = current.fit.getSlot(current.group, current.slot).getDiscounts();
			updateUIFitDiscounts(discounts);
			break;
		}
	}; // onUIFitSettingsOpsClick()


	var onUIFitSlotsMouseDown = function(e) {
		if (e.button != 2 && e.which != 3)
			return true;
		var el = e.target;
		while (el && el.tagName !== 'LABEL' && el.tagName !== 'INPUT') {
			el = el.parentNode;
		}
		if (!el) {
		} else if (el.tagName === 'LABEL') {
			var inputs = el.getElementsByTagName('INPUT');
			if (inputs.length > 0 && inputs[0].name === 'slot') {
				e.preventDefault();
				var slottag =inputs[0].value;
				var tokens = slottag.split('_');
				var slotgroup = tokens[0];
				var slotnum = tokens[1];
				if (!setCurrentFitSlotModule(slotgroup, slotnum, 0))
					setCurrentSlot(slotgroup, slotnum);
				return false;
			}
		}
		return true;
	}; // onUIFitSlotsMouseDown()


	var onUIFitSlotsChange = function(e) {
		if (e.target.name === 'slot') {
			var tokens = e.target.value.split('_');
			setCurrentSlot(tokens[0], tokens[1]);
		} else if (e.target.name === 'shipname') {
			current.fit.setName(e.target.value);
			updateUIFitStoredBuildControls();
			updateUIFitHash();
		} else if (e.target.name === 'shipnametag') {
			current.fit.setNameTag(e.target.value);
			updateUIFitStoredBuildControls();
			updateUIFitHash();
		} else if (e.target.type === 'checkbox') {
			var tokens = e.target.name.split('_');
			if (tokens[0] === 'powered') {
				setCurrentFitSlotPowered(tokens[1], tokens[2], e.target.checked);
			}
		} else if (e.target.name === 'hardpoint_attr1' || e.target.name === 'hardpoint_attr2') {
			for (var slotnum = 0;  current.fit.getSlot('hardpoint', slotnum);  slotnum++) {
				updateUIFitSlot('hardpoint', slotnum);
			}
		}
	}; // onUIFitSlotsChange()


	var onUIFitSlotsClick = function(e) {
		var el = e.target;
		while (el && el.tagName !== 'LABEL' && el.tagName !== 'INPUT' && el.tagName !== 'BUTTON') {
			el = el.parentNode;
		}
		if (!el) {
		} else if (el.tagName === 'LABEL') {
			var inputs = el.getElementsByTagName('INPUT');
			if (inputs.length > 0 && inputs[0].name === 'slot') {
				var slottag = inputs[0].value;
				if (!current.slotsClick[slottag]) { // single
					current.slotsClick[slottag] = setTimeout(onUIFitSlotsClickTimeout, TIMEOUT_DBLCLICK, slottag);
					if (inputs[0].checked && current.outfitting_focus !== 'slot') {
						var tokens = slottag.split('_');
						var slotgroup = tokens[0];
						var slotnum = tokens[1];
						setCurrentSlot(slotgroup, slotnum);
					}
				} else { // double
					clearTimeout(current.slotsClick[slottag]);
					delete current.slotsClick[slottag];
					setUIOutfittingFocus('module');
					updateUIDetailsStoredModules();
					updateUIDetailsStoredModuleControls(true);
					updateUIDetailsModule();
					setUIOutfittingPanels('modules',  'modules', 'slots');
				}
			}
		} else if (el.tagName === 'BUTTON') {
			e.preventDefault();
			var tokens = el.name.split('_');
			if (el.disabled) {
			} else if (tokens[0] === 'priority') {
				changeCurrentFitSlotPriority(tokens[1], tokens[2], 1);
			} else if (tokens[0] === 'crewdist') {
				changeCurrentFitCrewDist(tokens[1], 1);
			} else if (tokens[0] === 'powerdist') {
				if (tokens[1] === 'rst') {
					resetCurrentFitPowerDist();
				} else {
					changeCurrentFitPowerDist(tokens[1], 2);
				}
			}
		}
	}; // onUIFitSlotsClick()


	var onUIFitSlotsClickTimeout = function(slottag) {
		if (current.slotsClick[slottag]) {
			clearTimeout(current.slotsClick[slottag]);
			delete current.slotsClick[slottag];
			setUIOutfittingPanels('details');
		}
	}; // onUIFitSlotsClickTimeout()


	var onUIFitSlotsContextMenu = function(e) {
		var el = e.target;
		while (el && el.tagName !== 'LABEL' && el.tagName !== 'INPUT' && el.tagName !== 'BUTTON') {
			el = el.parentNode;
		}
		if (!el) {
		} else if (el.tagName === 'LABEL') {
		} else if (el.tagName === 'BUTTON') {
			e.preventDefault();
			var tokens = el.name.split('_');
			if (el.disabled) {
			} else if (tokens[0] === 'priority') {
				changeCurrentFitSlotPriority(tokens[1], tokens[2], -1);
			} else if (tokens[0] === 'crewdist') {
			} else if (tokens[0] === 'powerdist') {
			}
		} else if (el.tagName === 'INPUT') {
		}
	}; // onUIFitSlotsContextMenu()


	var onUIFitExportInaraButtonClick = function(e) {
		e.preventDefault();
		e.stopPropagation();
		var inaraURL = current.fit.getInaraBuildURL();
		if (!inaraURL)
			return;
		var form = document.createElement('form');
		form.method = 'POST';
		form.action = inaraURL;
		var input = document.createElement('input');
		input.type = 'hidden';
		input.name = 'externalslefimport';
		input.value = current.fit.exportSLEF();
		form.appendChild(input);
		document.body.appendChild(form);
		form.submit();
		document.body.removeChild(form);
	}; // onUIFitExportInaraButtonClick()


	var onUIPowerDistClick = function(e) {
		var el = e.target;
		while (el && el.tagName !== 'BUTTON') {
			el = el.parentNode;
		}
		if (!el) {
		} else if (el.tagName === 'BUTTON') {
			e.preventDefault();
			e.stopPropagation();
			var tokens = el.name.split('_');
			if (el.disabled) {
			} else if (tokens[0] === 'crewdist') {
				changeCurrentFitCrewDist(tokens[1], 1);
			} else if (tokens[0] === 'powerdist') {
				if (tokens[1] === 'rst') {
					resetCurrentFitPowerDist();
				} else {
					changeCurrentFitPowerDist(tokens[1], 2);
				}
			}
		}
	}; // onUIPowerDistClick()


	var onUIFitSlotsDblClick = function(e) {
		e.preventDefault();
		return false;
	}; // onUIFitSlotsDblClick()


	var onUIFitSlotsTouchStart = function(e) {
		e.stopPropagation();
		var label = e.currentTarget;
		var inputID = label.htmlFor;
		var touchdata = current.slotsTouch[inputID];
		if (e.touches.length !== 1) {
			return onUIFitSlotsTouchCancel(e);
		}
		if (touchdata) {
			clearTimeout(touchdata.timeout);
		} else {
			current.slotsTouch[inputID] = touchdata = { timeout:null, x:0, y:0 };
		}
		touchdata.timeout = setTimeout(onUIFitSlotsTouchTimeout, TIMEOUT_LONGPRESS, inputID);
		touchdata.x = e.touches[0].screenX;
		touchdata.y = e.touches[0].screenY;
		label.classList.add('active');
		label.addEventListener('touchmove', onUIFitSlotsTouchMove);
		label.addEventListener('touchend', onUIFitSlotsTouchEnd);
		label.addEventListener('touchcancel', onUIFitSlotsTouchCancel);
		return true;
	}; // onUIFitSlotsTouchStart()


	var onUIFitSlotsTouchMove = function(e) {
		e.stopPropagation();
		var label = e.currentTarget;
		var inputID = label.htmlFor;
		var touchdata = current.slotsTouch[inputID];
		if (!touchdata || e.touches.length !== 1 || abs(e.touches[0].screenX - touchdata.x) > TOLERANCE_TOUCH || abs(e.touches[0].screenY - touchdata.y) > TOLERANCE_TOUCH) {
			return onUIFitSlotsTouchCancel(e);
		}
		if (e.cancelable)
			e.preventDefault();
		return false;
	}; // onUIFitSlotsTouchMove()


	var onUIFitSlotsTouchEnd = function(e) {
		var label = e.currentTarget;
		var inputID = label.htmlFor;
		var touchdata = current.slotsTouch[inputID];
		onUIFitSlotsTouchCancel(e);
		if (!touchdata || e.touches.length > 0 || e.changedTouches.length !== 1 || abs(e.changedTouches[0].screenX - touchdata.x) > TOLERANCE_TOUCH || abs(e.changedTouches[0].screenY - touchdata.y) > TOLERANCE_TOUCH) {
			return true;
		}
		var input = document.getElementById(inputID);
		if ((input && !input.checked) || current.outfitting_focus !== 'slot') {
			var tokens = input.value.split('_');
			var slotgroup = tokens[0];
			var slotnum = tokens[1];
			setCurrentSlot(slotgroup, slotnum);
		}
		setUIOutfittingPanels('details');
		if (e.cancelable)
			e.preventDefault();
		return false;
	}; // onUIFitSlotsTouchEnd()


	var onUIFitSlotsTouchCancel = function(e, label) {
		if (e) {
			e.stopPropagation();
			label = e.currentTarget;
		}
		var inputID = label.htmlFor;
		var touchdata = current.slotsTouch[inputID];
		if (touchdata) {
			clearTimeout(touchdata.timeout);
			delete current.slotsTouch[inputID];
		}
		label.classList.remove('active');
		label.removeEventListener('touchmove', onUIFitSlotsTouchMove);
		label.removeEventListener('touchend', onUIFitSlotsTouchEnd);
		label.removeEventListener('touchcancel', onUIFitSlotsTouchCancel);
		return true;
	}; // onUIFitSlotsTouchCancel()


	var onUIFitSlotsTouchTimeout = function(inputID) {
		var input = document.getElementById(inputID);
		var label = input.parentNode;
		var touchdata = current.slotsTouch[inputID];
		onUIFitSlotsTouchCancel(null, label);
		if (!touchdata) {
			return true;
		}
		var tokens = input.value.split('_');
		var slotgroup = tokens[0];
		var slotnum = tokens[1];
		setCurrentSlot(slotgroup, slotnum);
		setUIOutfittingFocus('module');
		updateUIDetailsStoredModules();
		updateUIDetailsStoredModuleControls(true);
		updateUIDetailsModule();
		setUIOutfittingPanels('modules',  'modules', 'slots');
		return false;
	}; // onUIFitSlotsTouchTimeout()


	var onUIFitSlotsDragStart = function(e) {
		if (e.target && e.target.tagName === 'LABEL') {
			var inputs = e.target.getElementsByTagName('INPUT');
			var tokens = inputs[0].value.split('_');
			var slotgroup = tokens[0];
			var slotnum = tokens[1];
			var modid = current.fit.getSlot(slotgroup, slotnum).getModuleID();
			if ((GROUPS.indexOf(slotgroup) < 0) || slotgroup === 'component' || !modid) {
				e.preventDefault();
				return;
			}
			// TODO: ghost bug in chrome
			e.dataTransfer.setData('edsy/mid', modid | 0);
			e.dataTransfer.setData('edsy/group', slotgroup || '');
			e.dataTransfer.setData('edsy/slot', slotnum || '');
			e.dataTransfer.effectAllowed = 'copyMove';
			setCurrentDrag(modid, null, slotgroup, slotnum);
		}
	}; // onUIFitSlotsDragStart()


	var onUIFitSlotsDragEnd = function(e) {
		setCurrentDrag();
	}; // onUIFitSlotsDragEnd()


	var onUIFitSlotsDragEnter = function(e) {
		if (contains(e.dataTransfer.types, 'edsy/mid')) {
			e.preventDefault();
			// TODO: .dragready highlighting?
		} else {
			onDocumentDragEnter(e);
		}
	}; // onUIFitSlotsDragEnter()


	var onUIFitSlotsDragOver = function(e) {
		if (contains(e.dataTransfer.types, 'edsy/mid')) {
			e.preventDefault();
		} else {
			onDocumentDragOver(e);
		}
	}; // onUIFitSlotsDragOver()


	var onUIFitSlotsDragLeave = function(e) {
		// TODO: .dragready highlighting?
	}; // onUIFitSlotsDragLeave()


	var onUIFitSlotsDrop = function(e) {
		var tr = e.target;
		while (tr && tr.tagName !== 'TR')
			tr = tr.parentNode;
		if (tr && contains(e.dataTransfer.types, 'edsy/mid')) {
			var modid = parseInt(e.dataTransfer.getData('edsy/mid'));
			var namehash = e.dataTransfer.getData('edsy/namehash');
			var group1 = e.dataTransfer.getData('edsy/group');
			var slot1 = e.dataTransfer.getData('edsy/slot');
			var tokens = tr.id.split('_'); // outfitting_fit_slot_(group)_(slot)
			var group2 = tokens[3];
			var slot2 = tokens[4];
			if (group1) {
				e.preventDefault();
				e.stopPropagation();
				if (isDropEffectCopy(e)) {
					copyCurrentFitSlotModule(group1, slot1, group2, slot2);
				} else {
					swapCurrentFitSlotModules(group1, slot1, group2, slot2);
				}
			} else {
				e.preventDefault();
				e.stopPropagation();
				setCurrentFitSlotModule(group2, slot2, modid, namehash);
			}
		} else {
			onDocumentDrop(e);
		}
	}; // onUIFitSlotsDrop()


	var onUIDetailsSettingsChange = function(e) {
		if (e.target.name === 'outfitting_details_stored') {
			setUIDetailsNameHash(e.target.value);
		}
	}; // onUIDetailsSettingsChange()


	var onUIDetailsSettingsClick = function(e) {
		var el = e.target;
		while (el && el.tagName !== 'BUTTON')
			el = el.parentNode;
		if (!el || el.disabled) {
		} else {
			var tokens = el.id.split('_');
			if (tokens[2] === 'stored') {
				e.preventDefault();
				var namehash = document.forms.details.elements.outfitting_details_stored.value;

				switch (tokens[3]) {
				case 'reload':
					setUIDetailsNameHash(namehash);
					break;

				case 'save':
					saveCurrentStoredModule(false);
					break;

				case 'saveas':
					saveCurrentStoredModule(true);
					break;

				case 'rename':
					renameStoredModule(namehash);
					break;

				case 'delete':
					deleteStoredModule(namehash);
					break;
				}
			}
		}
	}; // onUIDetailsSettingsClick()


	var onUIDetailsModuleChange = function(e) {
		if (e.target.name === 'cost') {
			if (e.target.value) {
				// TODO input as discounts?
				setUIDetailsCost(parseNumText(e.target.value));
			} else {
				setUIDetailsDiscounts(0);
			}
		} else if (e.target.name === 'discount') {
			var slot = getUIOutfittingSlot();
			var bit = parseInt(e.target.value);
			if (bit) {
				var discounts = slot.getDiscounts();
				if (e.target.checked) {
					discounts = (((discounts == 0x3F) ? 0 : discounts) | bit);
				} else {
					discounts = (discounts & ~bit);
				}
				setUIDetailsDiscounts(discounts);
			} else {
				if (e.target.checked) {
					setUIDetailsCost(slot.getCost());
				} else {
					setUIDetailsDiscounts(slot.getDiscounts());
				}
			}
		} else if (e.target.name === 'pre_engineered') {
			setUIDetailsPreEngineered(e.target.checked ? 1 : 0);
		} else if (e.target.name === 'blueprint') {
			setUIDetailsBlueprintID(e.target.value);
		} else if (e.target.name === 'blueprint_grade') {
			setUIDetailsBlueprintGrade(parseInt(e.target.value));
		} else if (e.target.name === 'blueprint_roll') {
			var value = e.target.value.trim();
			if (value) {
				value = parseNumText(e.target.value);
				setUIDetailsBlueprintRoll(isNaN(value) ? null : (value / 100.0));
			} else {
				updateUIDetailsBlueprintRoll();
			}
		} else if (e.target.name === 'expeffect') {
			setUIDetailsExpeffect(e.target.value);
		} else if (e.target.tagName === 'INPUT') {
			setUIDetailsAttrText(e.target.name, e.target.value);
		}
	}; // onUIDetailsModuleChange()


	var onUIDetailsRollTouchStart = function(e) {
		var el = e.target;
		while (el && el !== e.currentTarget) {
			if (el.tagName === 'INPUT')
				return onUIDetailsRollTouchCancel(e);
			el = el.parentNode;
		}
		var input = document.forms.details.elements.blueprint_roll;
		if (!el || input.disabled || e.touches.length !== 1)
			return onUIDetailsRollTouchCancel(e);
		e.preventDefault();
		e.stopPropagation();
		var rect = input.getBoundingClientRect();
		var touchdata = current.bprollTouch = {
			x:  (rect.right + rect.left) / 2,
			rx: (rect.right - rect.left) / 2,
			y:  (rect.bottom + rect.top) / 2,
			ry: (rect.bottom - rect.top) / 2,
		};
		var el = document.getElementById('engineering_roll');
		el.addEventListener('touchmove', onUIDetailsRollTouchMove);
		el.addEventListener('touchend', onUIDetailsRollTouchEnd);
		el.addEventListener('touchcancel', onUIDetailsRollTouchCancel);
		return onUIDetailsRollTouchMove(e);
	}; // onUIDetailsRollTouchStart()


	var onUIDetailsRollTouchMove = function(e) {
		var touchdata = current.bprollTouch;
		if (!touchdata || e.touches.length !== 1)
			return onUIDetailsRollTouchCancel(e);
		e.preventDefault();
		e.stopPropagation();
		var obj = e.touches[0];
		var dx = obj.clientX - touchdata.x;
		var dy = obj.clientY - touchdata.y;
		var bproll = (((abs(dx) <= touchdata.rx) && (abs(dy) <= touchdata.ry)) ? -1 : (ceil((0.5 - atan2(dx,dy) / PI / 2) * 20) / 20));
		updateUIDetailsBlueprintRoll(bproll);
	}; // onUIDetailsRollTouchMove()


	var onUIDetailsRollTouchEnd = function(e) {
		e.preventDefault();
		e.stopPropagation();
		onUIDetailsRollTouchCancel(e);
		var value = parseNumText(document.forms.details.elements.blueprint_roll.value);
		setUIDetailsBlueprintRoll(isNaN(value) ? null : (value / 100.0));
	}; // onUIDetailsRollTouchEnd()


	var onUIDetailsRollTouchCancel = function(e) {
		current.bprollTouch = null;
		var el = document.getElementById('engineering_roll');
		el.removeEventListener('touchmove', onUIDetailsRollTouchMove);
		el.removeEventListener('touchend', onUIDetailsRollTouchEnd);
		el.removeEventListener('touchcancel', onUIDetailsRollTouchCancel);
	}; // onUIDetailsRollTouchCancel()


	var onUIDetailsRollMouseDown = function(e) {
		var el = e.target;
		while (el && el !== e.currentTarget) {
			if (el.tagName === 'INPUT')
				return;
			el = el.parentNode;
		}
		var input = document.forms.details.elements.blueprint_roll;
		if (!el || input.disabled)
			return;
		e.preventDefault();
		e.stopPropagation();
		var rect = input.getBoundingClientRect();
		var clickdata = current.bprollClick = {
			x:  (rect.right + rect.left) / 2,
			y:  (rect.bottom + rect.top) / 2,
		};
		document.addEventListener('mousemove', onUIDetailsRollMouseMove, true);
		document.addEventListener('mouseup', onUIDetailsRollMouseUp, true);
		return onUIDetailsRollMouseMove(e);
	}; // onUIDetailsRollMouseDown()


	var onUIDetailsRollMouseMove = function(e) {
		var clickdata = current.bprollClick;
		if (!clickdata)
			return onUIDetailsRollMouseUp(e);
		var obj = e;
		var dx = obj.clientX - clickdata.x;
		var dy = obj.clientY - clickdata.y;
		var bproll = ((e.target === document.forms.details.elements.blueprint_roll) ? -1 : (ceil((0.5 - atan2(dx,dy) / PI / 2) * 20.0) / 20.0));
		updateUIDetailsBlueprintRoll(bproll);
	}; // onUIDetailsRollMouseMove()


	var onUIDetailsRollMouseUp = function(e) {
		current.bprollClick = null;
		document.removeEventListener('mousemove', onUIDetailsRollMouseMove, true);
		document.removeEventListener('mouseup', onUIDetailsRollMouseUp, true);
		var value = parseNumText(document.forms.details.elements.blueprint_roll.value);
		setUIDetailsBlueprintRoll(isNaN(value) ? null : (value / 100.0));
	}; // onUIDetailsRollMouseUp()


	var onUIDetailsRollButtonClick = function(e) {
		e.preventDefault();
		e.stopPropagation();
		setUIDetailsBlueprintRoll(e.target.value);
	}; // onUIDetailsRollButtonClick()


	var onUIDetailsButtonsClick = function(e) {
		var el = e.target;
		while (el && el.tagName !== 'BUTTON')
			el = el.parentNode;
		if (!el || el.disabled) {
		} else if (el.name === 'back') {
			if (current.outfitting_focus === 'slot') {
				setUIOutfittingPanels('slots',  'modules', 'slots');
			} else if (current.outfitting_focus === 'module') {
				setUIOutfittingPanels('modules',  'modules', 'slots');
			}
		} else if (el.name === 'replace') {
			if (current.outfitting_focus === 'slot') {
				setUIOutfittingFocus('module');
				updateUIDetailsStoredModules();
				updateUIDetailsStoredModuleControls(true);
				updateUIDetailsModule();
				setUIOutfittingPanels('modules',  'modules', 'slots');
			} else if (current.outfitting_focus === 'module') {
				setCurrentFitSlotModule(current.group, current.slot, null, null, current.pickerSlot.getStoredHash());
				setUIOutfittingPanels('slots',  'slots', 'details');
			}
		}
	}; // onUIDetailsButtonsClick()


	var onUIBottomChange = function(e) {
		var tokens = e.target.id.split('_'); // stats_toggle_(#)
		if (tokens[0] === 'stats' && tokens[1] === 'toggle' && e.target.checked) {
			// let the changes finish rendering
			setTimeout(updateUIStatsPanels, 1, tokens[2]);
		}
	}; // onUIBottomChange()


	var onUIStatsInputWheel = function(e) {
		e.preventDefault();
		var mod;
		if (e.deltaY) {
			mod = (e.deltaY > 0) ? -1 : 1;
		} else if (e.detail) {
			mod = (e.detail > 0) ? -1 : 1;
		} else if (e.wheelDelta) {
			mod = (e.wheelDelta > 0) ? 1 : -1;
		} else {
			return;
		}
		var value = parseNumText(e.target.value);
		var step = (e.shiftKey ? 10 : 1);
		value = ((mod < 0) ? ceil : floor)((value + 0.1 * mod) / step + mod) * step;
		switch (e.target.name) {
		case 'stats_cur_fuel':   setStatsCurFuel(value);   break;
		case 'stats_cur_cargo':  setStatsCurCargo(value);  break;
		}
	}; // onUIStatsInputWheel()


	var onUIStatsInputChange = function(e) {
		e.stopPropagation();
		switch (e.target.name) {
		case 'stats_cur_fuel':   setStatsCurFuel(parseNumText(e.target.value) || 0);   break;
		case 'stats_cur_cargo':  setStatsCurCargo(parseNumText(e.target.value) || 0);  break;
		}
	}; // onUIStatsInputChange()


	var onUIOptionsChange = function(e) {
		var elements = document.forms.options.elements;
		current.option.insurance = parseInt(elements.insurance.value);
		var inputs = document.getElementById('options_discounts_bits').getElementsByTagName('INPUT');
		current.option.discounts = 0;
		for (var i = 0;  i < inputs.length;  i++) {
			if (inputs[i].name === 'discount' && inputs[i].checked && (inputs[i] == e.target || inputs[i].value != 0x3F)) {
				current.option.discounts |= parseInt(inputs[i].value);
			}
		}
		current.option.builtin = elements.builtin.value;
		for (var bmodid in BUILTIN_STORED_MODULES) {
			var opt = 'builtin' + bmodid;
			current.option[opt] = elements[opt].checked;
		}
		current.option.onlybest = elements.onlybest.value;
		current.option.revsize = elements.revsize.checked;
		current.option.revrating = elements.revrating.checked;
		current.option.experimental = elements.experimental.checked;
		current.option.show1 = elements.show1.checked;
		current.option.show2 = elements.show2.checked;
		current.option.show3 = elements.show3.checked;
		current.option.hidestats = elements.hidestats.checked;
		for (var i = 0;  i < CSS_FONTS.length;  i++) {
			var opt = 'font' + CSS_FONTS[i];
			current.option[opt] = elements[opt].value;
		}
		current.option.colorinvert = elements.colorinvert.checked;
		for (var i = 0;  i < CSS_COLORS.length;  i++) {
			for (var n = 1;  n <= 5;  n++) {
				var opt = 'color' + CSS_COLORS[i] + n;
				current.option[opt] = elements[opt].value;
			}
		}
		current.option.language = elements.language.value;
		updateUIOptions();

		updateUILayout();
		readStoredModules();
		sortCache(true);
		initUIModulePicker();
		updateUIModulePickerStoredModules();
		updateUIModulePickerWarnings();
		updateUIDetailsStoredModules();
		updateUIDetailsStoredModuleControls();
		updateUIDetailsModifications();
		updateUIStatsPanels();
		updateUIStatsTotals();
		current.fit.clearPrevStats();

		writeStoredOptions();

		loadTranslations(true); // async
	}; // onUIOptionsChange()


	var onUIOptionsClick = function(e) {
		var el = e.target;
		while (el && el.tagName !== 'BUTTON')
			el = el.parentNode;
		if (!el || el.disabled) {
		} else if (el.name === 'colormatrix') {
			e.stopPropagation();
			e.preventDefault();
			var xml = prompt(getTranslation('ui-options-appearance-colormatrix-prompt'), '');
			if (!xml)
				return;
			var matrix = {};
			var reColorMatrix = /< *matrix(red|green|blue) *> *([-0-9\.]+) *, *([-0-9\.]+) *, *([-0-9\.]+) *< *\/ *matrix\1 *>/gi;
			for (var match;  match = reColorMatrix.exec(xml);  ) {
				var r = parseFloat(match[2]);
				var g = parseFloat(match[3]);
				var b = parseFloat(match[4]);
				if (!(isNaN(r) || isNaN(g) || isNaN(b))) {
					matrix[match[1].toLowerCase()] = [r,g,b];
				}
			}
			if (!matrix.red || !matrix.green || !matrix.blue) {
				alert(getTranslation('ui-options-appearance-colormatrix-error'));
				return;
			}
			for (var i = 0;  i < CSS_COLORS.length;  i++) {
				for (var n = 1;  n <= 5;  n++) {
					var opt = 'color' + CSS_COLORS[i] + n;
					var r0 = parseInt(cache.option[opt].slice(1,3), 16);
					var g0 = parseInt(cache.option[opt].slice(3,5), 16);
					var b0 = parseInt(cache.option[opt].slice(5,7), 16);
					var r1 = ('0' + min(max(((r0*matrix.red[0] + g0*matrix.green[0] + b0*matrix.blue[0] + 0.5) | 0), 0), 255).toString(16)).slice(-2);
					var g1 = ('0' + min(max(((r0*matrix.red[1] + g0*matrix.green[1] + b0*matrix.blue[1] + 0.5) | 0), 0), 255).toString(16)).slice(-2);
					var b1 = ('0' + min(max(((r0*matrix.red[2] + g0*matrix.green[2] + b0*matrix.blue[2] + 0.5) | 0), 0), 255).toString(16)).slice(-2);
					current.option[opt] = '#'+r1+g1+b1;
				}
			}
			updateUIOptions();
		} else if (el.name === 'reset') {
			var elements = document.forms.options.elements;
			if (el.value.slice(0,4) === 'font') {
				elements[el.value].value = '';
			} else if (el.value === 'colorinvert') {
				elements[el.value].checked = false;
			} else if (el.value.slice(0,5) === 'color') {
				for (var n = 1;  n <= 5;  n++)
					elements[el.value + n].value = '';
			} else {
				return;
			}
			e.stopPropagation();
			e.preventDefault();
			onUIOptionsChange(e);
		}
	}; // onUIOptionsClick()


	var onUIOptionsBackupClick = function(e) {
		e.preventDefault();
		e.stopPropagation();
		var obj = {
			format: 'edsy',
			version: VERSIONS[3],
		//  imports: current.importLabel, // no need to migrate this; it's a minor convenience, easy enough to re-populate, and may get bloated over time
			builds: {},
			modules: {},
		};
		for (var namehash in current.stored.shipNamehashStored[0])
			obj.builds[namehash] = current.stored.shipNamehashStored[0][namehash].buildhash;
		for (var namehash in current.stored.moduleNamehashStored[0]) {
			// skip builtins
			if (!hashDecodeS(namehash).startsWith(" "))
				obj.modules[namehash] = current.stored.moduleNamehashStored[0][namehash].modulehash;
		}
		var json = JSON.stringify(obj, null, 2);
		showUITextPopup(
				getTranslation('ui-options-backup-prompt'),
				json,
				e.target, false,
				true, false
		);
	}; // onUIOptionsBackupClick()


	var onUIOptionsRestoreClick = function(e) {
		e.preventDefault();
		e.stopPropagation();
		showUIImportPopup();
	}; // onUIOptionsRestoreClick()


	var onWindowHashChange = function(e) {
		processURLHash(window.location, true);
	}; // onWindowHashChange()


	var onBodyFocus = function(e) {
		if (e.target.tagName === 'INPUT' && e.target.type === 'text' && e.target.select)
			e.target.select();
	}; // onBodyFocus()


	var onFormSubmit = function(e) {
		e.preventDefault();
	}; // onFormSubmit()


	var onStorageEvent = function(e) {
		readStoredOptions();
		updateUIOptions();
		readStoredImports();
		readStoredBuilds();
		updateUIShipyardStoredBuilds();
		updateUIFitStoredBuilds();
		readStoredModules();
		updateUIModulePickerStoredModules();
		updateUIDetailsStoredModules();
		updateUIDetailsStoredModuleControls();
		loadTranslations(true); // async
	}; // onStorageEvent()


	/*
	* UI INIT
	*/


	var verifyVersionSync = function() {
		var vH,vC,vD,vJ;
		var dH,dC,dD,dJ;
		try {
			vH = document.getElementById('edsy_versions_html').getAttribute('content').split(',');
			vH = [ parseInt(vH[0]),parseInt(vH[1]),parseInt(vH[2]),parseInt(vH[3]) ];
			dH = parseInt((document.getElementById('last_modified').getAttribute('content') || '0').replace(/-/g,''));
		} catch (e) {
			vH = [ 0,0,0,0 ];
			dH = 0;
		}
		try {
			var compstyle = getComputedStyle(document.documentElement);
			vC = compstyle.getPropertyValue('--edsy-versions-css').trim();
			dC = compstyle.getPropertyValue('--edsy-lastmodified-css').trim();
			if (dC[0] == 'd') {
				vC = vC.split('-');
				vC = [ parseInt(vC[1]),parseInt(vC[2]),parseInt(vC[3]),parseInt(vC[4]) ];
				dC = parseInt(dC.split('-')[1] || 0);
			} else {
				vC = vC.split(',');
				vC = [ parseInt(vC[0]),parseInt(vC[1]),parseInt(vC[2]),parseInt(vC[3]) ];
				dC = parseInt(dC || 0);
			}
		} catch (e) {
			vC = [ 0,0,0,0 ];
			dC = 0;
		}
		try {
			vD = ((eddb || EMPTY_OBJ).edsy_versions_db || EMPTY_ARR);
			vD = [ parseInt(vD[0]),parseInt(vD[1]),parseInt(vD[2]),parseInt(vD[3]) ];
			dD = ((eddb || EMPTY_OBJ).edsy_lastmodified_db || 0);
		} catch (e) {
			vD = [ 0,0,0,0 ];
			dD = 0;
		}
		try {
			vJ = (VERSIONS || EMPTY_ARR);
			vJ = [ parseInt(vJ[0]),parseInt(vJ[1]),parseInt(vJ[2]),parseInt(vJ[3]) ];
			dJ = LASTMODIFIED;
		} catch (e) {
			vJ = [ 0,0,0,0 ];
			dJ = 0;
		}

		// fill in the current version and update date
		var v = ('0000000000' + max(vH[0], vC[1], vD[2], vJ[3])).slice(-10);
		var d = '' + max(dH, dC, dD, dJ) + '00000000';
		document.getElementById('version_label').setAttribute('edsy-vals', JSON.stringify({
			'a':parseInt(v.slice(0,2)),
			'b':parseInt(v.slice(2,4)),
			'c':parseInt(v.slice(4,6)),
			'rc':(['-','a','b','rc'][parseInt(v.slice(6,8))] || '.'),
			'd':parseInt(v.slice(8,10)),
			'date':(d.slice(0,4) + '-' + d.slice(4,6) + '-' + d.slice(6,8)),
		}));
		document.getElementById('version_label').setAttribute('edsy-text', 'interp-version-abcd');
		document.getElementById('version_label').innerHTML = ('v' + parseInt(v.slice(0,2)) + '.' + parseInt(v.slice(2,4)) + '.' + parseInt(v.slice(4,6)) + (['-','a','b','rc'][parseInt(v.slice(6,8))] || '.') + parseInt(v.slice(8,10)));
		document.getElementById('version_label').setAttribute('edsy-title', 'interp-updated-date');
		document.getElementById('version_label').title = ('updated ' + d.slice(0,4) + '-' + d.slice(4,6) + '-' + d.slice(6,8));

		// cross check expected versions
		var vM = [
			max(vC[0], max(vD[0], vJ[0])),
			max(vH[1], max(vD[1], vJ[1])),
			max(vH[2], max(vC[2], vJ[2])),
			max(vH[3], max(vC[3], vD[3])),
		];
		var ok = true;
		if (vH[0] < vM[0]) {
			ok = false;
			console.log('ERROR: EDSY HTML version mismatch: (' + vH[0] + ') / ' + vC[0] + ' / ' + vD[0] + ' / ' + vJ[0]);
		}
		if (vC[1] < vM[1]) {
			ok = false;
			console.log('ERROR: EDSY CSS version mismatch: ' + vH[1] + ' / (' + vC[1] + ') / ' + vD[1] + ' / ' + vJ[1]);
		}
		if (vD[2] < vM[2]) {
			ok = false;
			console.log('ERROR: EDSY DB version mismatch: ' + vH[2] + ' / ' + vC[2] + ' / (' + vD[2] + ') / ' + vJ[2]);
		}
		if (vJ[3] < vM[3]) {
			ok = false;
			console.log('ERROR: EDSY JS version mismatch: ' + vH[3] + ' / ' + vC[3] + ' / ' + vD[3] + ' / (' + vJ[3] + ')');
		}
		return ok;
	}; // verifyVersionSync()


	var initBrowser = function() {
		// sniff env and locale
		current.dev = (window.location.protocol === 'file:') || (window.location.pathname.indexOf('/dev/') >= 0);
		current.beta = current.dev || (window.location.pathname.indexOf('/beta/') >= 0);
		current.locale = ((window.navigator.languages || EMPTY_ARR)[0] || window.navigator.userLanguage || window.navigator.language || window.navigator.browserLanguage || window.navigator.systemLanguage || undefined);
		current.lang = (current.locale ? current.locale.substr(0,2) : undefined);
		if (!LANG_NAMES[current.lang])
			current.lang = LANG_DEFAULT;

		// test for browser features
		cache.feature.history = (window.history && window.history.replaceState);
		cache.feature.file = (window.File && window.FileReader && window.FileList);
		cache.feature.storage = (window.localStorage && window.localStorage.getItem && window.localStorage.setItem && window.localStorage.removeItem);
		if (cache.feature.storage) {
			try {
				window.localStorage.setItem('edsy_localstorage_test', 'edsy_localstorage_test');
				if (window.localStorage.getItem('edsy_localstorage_test') !== 'edsy_localstorage_test')
					throw 'err';
				window.localStorage.removeItem('edsy_localstorage_test');
			} catch (err) {
				cache.feature.storage = false;
			}
		}
		var doc = window.document;
		var docEl = doc.documentElement;
		cache.feature.requestFullscreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
		cache.feature.cancelFullscreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
	}; // initBrowser()


	var loadTranslations = async function(update) {
		var lang = current.lang;
		if (cache.lang == lang)
			return;

		var file = "lang-" + lang + ".json";
		var response = await fetch(file);
		if (!response.ok) {
			console.log("ERROR: failed to load '" + file + "': " + response.status + " " + response.statusText);
			return;
		}
		var text = await response.text();
		text = text.replace(/(\/\/[^"]*|\/\*[^"]*\*\/\s*)$/gm, '');
		try {
			var translation = JSON.parse(text);
		} catch (exc) {
			console.log("failed to parse " + lang + " translations from " + file + ": " + exc.toString());
			return;
		}
		cache.lang = lang;
		cache.translation = translation;
		// 'en' should be the first one loaded
		cache.translationDefault = cache.translationDefault || translation;

		if (update)
			await updateTranslations(); // async
	}; // loadTranslations()


	var getTranslation = function(key, values) {
		var text = cache.translation[key];
		if (text === undefined) {
			text = cache.translationDefault[key];
			if (text === undefined && current.dev) console.log("WARNING: no default translation for '" + key + "'");
		 }
		if (text && values) {
			text = text.replaceAll(cache.reTranslationValue, function(match, group1) {
				var v = values[group1];
				return (v === null || typeof v === 'number')
					? (values[group1+'%'] ? formatPctText : formatNumText)((values[group1+'!'] * Infinity) || v, values[group1+'#'] || 0)
					: (v ? v.toString() : '')
			});
		}
		return text;
	}; // getTranslation()


	var createTranslatedElement = function(name, key, values) {
		var el = document.createElement(name || 'span');
		if (values)
			el.setAttribute('edsy-vals', JSON.stringify(values));
		el.setAttribute('edsy-text', key || '');
		el.innerHTML = encodeHTML(getTranslation(key, values) || '');
		return el;
	}; // createTranslatedElement()


	var updateTranslations = function(doc) {
		var t0 = Date.now();

		var attrs = { "edsy-text": "innerText", "edsy-title": "title" };
		for (var keyattr in attrs) {
			var setattr = attrs[keyattr];
			(doc || document).querySelectorAll("["+keyattr+"]").forEach(function (el) {
				var key = el.getAttribute(keyattr);
				var vals = ((keyattr === 'edsy-title') ? el.getAttribute('edsy-vals-title') : '') || el.getAttribute("edsy-vals");
				if (key === undefined || key === null || key === '') {
					return;
				} else if (vals === '') {
					vals = {};
				} else if (vals) {
					try {
						vals = JSON.parse(vals);
					} catch (exc) {
						if (current.dev) console.log("WARNING: invalid translation edsy-vals " + vals);
						vals = null;
					}
				}
				var text = getTranslation(key, vals);
				if (text !== undefined) {
					el[setattr] = text;
				}
			});
		}

		// if updating the whole page, re-sort cache using new translations and re-draw UI elements based on those sorts
		if (!doc) {
			document.documentElement.style.setProperty('--textempty', "'"+getTranslation('note-empty')+"'");
			sortCache();
			sortUIShipyardTable(document.getElementById('shipyard_ships_table'), UI_SHIPYARD_SHIPS_COLS);
			initUIModulePicker();
			updateUIModulePickerStoredModules();
			updateUIModulePickerWarnings();
			sortUIOptionsBuiltins();
			updateUIDetailsModule();
		}

		var t1 = Date.now();
		if (!doc && current.dev) console.log("updateTranslations(): '" + cache.lang + "' completed in " + (t1-t0) + "ms");
	}; // updateTranslations()


	var initUIEventHandlers = function() {
		window.addEventListener('resize', onWindowResize);
		if (cache.feature.history)
			window.addEventListener('hashchange', onWindowHashChange);
		if (cache.feature.storage)
			window.addEventListener('storage', onStorageEvent);
		document.body.addEventListener('click', onBodyClickCapture, true);
		document.body.addEventListener('focus', onBodyFocus);
		if (cache.feature.file) {
			document.addEventListener('dragenter', onDocumentDragEnter);
			document.addEventListener('dragover', onDocumentDragOver);
			document.addEventListener('drop', onDocumentDrop);
		}
		for (var f = 0;  f < document.forms.length;  f++)
			document.forms[f].addEventListener('submit', onFormSubmit);
		document.getElementById('window_maximize').addEventListener('click', onUIMaximizeButtonClick);
		document.getElementById('window_minimize').addEventListener('click', onUIMinimizeButtonClick);
		document.getElementById('page_tabs').addEventListener('change', onUIPageHeaderChange);
		document.getElementById('query_tool').addEventListener('touchstart', onUIQueryTouchStart);
		document.getElementById('query_tool').addEventListener('mousedown', onUIQueryMouseDown);
		// document.getElementById('page_body_shipyard').addEventListener('contextmenu', onUIContextMenu); // why?
		document.getElementById('shipyard_tabs').addEventListener('change', onUIShipyardTabChange);
		document.getElementById('shipyard_ships_container').addEventListener('click', onUIShipyardShipsClick);
		document.getElementById('shipyard_storedbuilds_container').addEventListener('click', onUIShipyardStoredBuildsClick);
		document.getElementById('page_body_outfitting').addEventListener('contextmenu', onUIContextMenu);
		document.getElementById('outfitting_modules_tabs').addEventListener('change', onUIModuleTabChange);
		document.getElementById('outfitting_modules_container').addEventListener('change', onUIModulePickerChange);
		document.getElementById('outfitting_modules_container').addEventListener('click', onUIModulePickerClick);
		document.getElementById('outfitting_modules_container').addEventListener('dblclick', onUIModulePickerDblClick);
		document.getElementById('outfitting_modules_container').addEventListener('dragstart', onUIModulePickerDragStart);
		document.getElementById('outfitting_modules_container').addEventListener('dragend', onUIModulePickerDragEnd);
		document.getElementById('outfitting_modules_container').addEventListener('drop', onUIModulePickerDrop);
		document.getElementById('outfitting_modules_buttons').addEventListener('click', onUIModuleButtonsClick);
		document.getElementById('outfitting_stored_container').addEventListener('click', onUIFitSettingsStoredClick);
		document.getElementById('outfitting_stored_container').addEventListener('change', onUIFitSettingsStoredChange);
		document.getElementById('outfitting_cols_popout').addEventListener('change', onUIFitSettingsColsChange);
		document.getElementById('outfitting_ops_popout').addEventListener('click', onUIFitSettingsOpsClick);
		document.getElementById('outfitting_fit_slots').addEventListener('mousedown', onUIFitSlotsMouseDown);
		document.getElementById('outfitting_fit_slots').addEventListener('change', onUIFitSlotsChange);
		document.getElementById('outfitting_fit_slots').addEventListener('click', onUIFitSlotsClick);
		document.getElementById('outfitting_fit_slots').addEventListener('contextmenu', onUIFitSlotsContextMenu);
		document.getElementById('outfitting_fit_slots').addEventListener('dblclick', onUIFitSlotsDblClick);
		document.getElementById('outfitting_fit_slots').addEventListener('dragstart', onUIFitSlotsDragStart);
		document.getElementById('outfitting_fit_slots').addEventListener('dragend', onUIFitSlotsDragEnd);
		document.getElementById('outfitting_fit_slots').addEventListener('drop', onUIFitSlotsDrop);
		document.forms.fit.elements.export_inara.addEventListener('click', onUIFitExportInaraButtonClick);
		document.getElementById('outfitting_details_settings').addEventListener('change', onUIDetailsSettingsChange);
		document.getElementById('outfitting_details_settings').addEventListener('click', onUIDetailsSettingsClick);
		document.getElementById('outfitting_details_module').addEventListener('change', onUIDetailsModuleChange);
		document.getElementById('engineering_roll').addEventListener('touchstart', onUIDetailsRollTouchStart);
		document.getElementById('engineering_roll').addEventListener('mousedown', onUIDetailsRollMouseDown);
		document.forms.details.elements.blueprint_roll_preset1.addEventListener('click', onUIDetailsRollButtonClick);
		document.forms.details.elements.blueprint_roll_preset2.addEventListener('click', onUIDetailsRollButtonClick);
		document.forms.details.elements.blueprint_roll_preset3.addEventListener('click', onUIDetailsRollButtonClick);
		document.getElementById('outfitting_details_buttons').addEventListener('click', onUIDetailsButtonsClick);
		document.getElementById('outfitting_bottom').addEventListener('change', onUIBottomChange);
		document.forms.stats.elements.stats_cur_fuel.addEventListener('wheel', onUIStatsInputWheel);
		document.forms.stats.elements.stats_cur_fuel.addEventListener('change', onUIStatsInputChange);
		document.forms.stats.elements.stats_cur_cargo.addEventListener('wheel', onUIStatsInputWheel);
		document.forms.stats.elements.stats_cur_cargo.addEventListener('change', onUIStatsInputChange);
		document.getElementById('outfitting_fit_crewdist').addEventListener('click', onUIPowerDistClick);
		document.getElementById('outfitting_fit_powerdist').addEventListener('click', onUIPowerDistClick);
		document.getElementById('page_body_options').addEventListener('change', onUIOptionsChange);
		document.getElementById('page_body_options').addEventListener('click', onUIOptionsClick);
		document.getElementById('options_backup').addEventListener('click', onUIOptionsBackupClick);
		document.getElementById('options_restore').addEventListener('click', onUIOptionsRestoreClick);
	}; // initUIEventHandlers()


	var initUIFinal = function() {
		// set initial UI state
		setUIPageTab('shipyard');
		setUIShipyardTab('ships');
		setUIModuleTab('SLOT');
		updateUIFitColumns();

		// check for initial import or build hash
		var buffer_storage, buffer_cookie;
		if (buffer_storage = (window.sessionStorage && window.sessionStorage.getItem('edsy_import_buffer'))) {
			window.sessionStorage.removeItem('edsy_import_buffer');
		}
		if (buffer_cookie = getCookie('edsy_import_buffer')) {
			document.cookie = 'edsy_import_buffer=; domain=.edsy.org; path=' + (current.dev ? '/dev' : '/');
			document.cookie = 'edsy_import_buffer=; domain=.edsy.org; path=' + (current.dev ? '/dev' : '/') + '; max-age=0; expires=Thu, 01 Jan 1970 00:00:01 GMT';
		}
		current.hashlock = true;
		setCurrentFit(new Build(1, true), '');
		current.hashlock = false;
		if (buffer_storage && importData(buffer_storage)) {
		} else if (buffer_cookie && importData(buffer_cookie)) {
		} else if (window.location.hash.length > 0 && processURLHash(window.location, true)) {
		}
		setUIOutfittingPanels('slots',  'slots', 'details');

		// after all the current content is finished rendering, check the layout
		updateUIFullscreen();
		setTimeout(updateUILayout, 1);
		setTimeout(updateUIStatsPanels, 2);
	}; // initUIFinal()


	var onDOMContentLoaded = function(e) {
		// add popup events now, in case we need them for the version sync
		document.getElementById('popup_modal').addEventListener('keydown', onUIModalKeydownCapture, true);
		document.getElementById('popup_modal').addEventListener('click', onUIModalClick);
		document.getElementById('popup_cancel').addEventListener('click', onUIPopupButtonClick);
		document.getElementById('popup_okay').addEventListener('click', onUIPopupButtonClick);

		verifyVersionSync();

		// process remaining initialization asynchronously so that the loading animation can run
		var steps = [
			initCache,
			initBrowser,

			// initialize UI
			initUIShipyardShips,
			initUIShipyardStoredBuilds,
			initUIFitSlots,
			initUIDetails,
			initUIOptions,

			// initialize storage
			readStoredOptions,
			updateUIOptions,
			initUIModulePicker, // affected by sort options
			readStoredImports,
			readStoredBuilds,
			updateUIShipyardStoredBuilds,
			readStoredModules,
			updateUIModulePickerStoredModules,

			// finalize and launch UI
			initUIEventHandlers,
			loadTranslations,
			updateTranslations,
			initUIFinal,
		];
		var timings = [];
		var init = async function() {
			var step = steps.shift();
			var t0 = Date.now();
			await step();
			timings.push(step.name+':'+(Date.now()-t0));
			if (steps.length > 0) {
				setTimeout(init, 0);
			} else if (current.dev) {
				console.log(timings.join(',\n'));
			}
		};
		setTimeout(init, 0);
	}; // onDOMContentLoaded()

	// initialize browser features
	cache.feature.history = false;
	cache.feature.file = false;
	cache.feature.storage = false;
	cache.feature.requestFullscreen = false;
	cache.feature.cancelFullscreen = false;

	// if we're in interactive mode, queue the remaining UI init
	if (document.title === 'EDSY') {
		window.addEventListener('DOMContentLoaded', function() { loadTranslations(false).then(onDOMContentLoaded); });
	} else {
		// else expose the Build and Slot for headless tooling
		this.Versions = () => [...VERSIONS]
		this.Build = Build;
		this.Slot = Slot;
		initCache()
	}
})();
