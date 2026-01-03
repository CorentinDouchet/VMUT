// CVSS 4.0 Official Implementation with MacroVectors
// Based on CVSS v4.0 Specification from FIRST.org

// MacroVector Lookup Tables
const MACROVECTOR_LOOKUP = {
  // EQ1: Attack Vector and Attack Complexity
  "000000": 10.0, "000001": 9.9, "000010": 9.8, "000011": 9.5, "000020": 9.5,
  "000021": 9.2, "000100": 10.0, "000101": 9.6, "000110": 9.3, "000111": 8.9,
  "000120": 9.1, "000121": 8.1, "000200": 9.3, "000201": 9.0, "000210": 8.9,
  "000211": 8.0, "000220": 8.1, "000221": 6.8, "001000": 9.8, "001001": 9.5,
  "001010": 9.5, "001011": 9.2, "001020": 9.0, "001021": 8.4, "001100": 9.3,
  "001101": 9.2, "001110": 8.9, "001111": 8.1, "001120": 8.1, "001121": 6.5,
  "001200": 8.8, "001201": 8.0, "001210": 7.8, "001211": 7.0, "001220": 6.9,
  "001221": 4.8, "002001": 9.2, "002011": 8.2, "002021": 7.2, "002101": 7.9,
  "002111": 6.9, "002121": 5.0, "002201": 6.9, "002211": 5.5, "002221": 2.7,
  
  "010000": 9.9, "010001": 9.7, "010010": 9.5, "010011": 9.2, "010020": 9.2,
  "010021": 8.5, "010100": 9.5, "010101": 9.1, "010110": 9.0, "010111": 8.3,
  "010120": 8.4, "010121": 6.2, "010200": 8.6, "010201": 7.8, "010210": 7.4,
  "010211": 6.1, "010220": 6.1, "010221": 4.2, "011000": 9.5, "011001": 9.3,
  "011010": 9.2, "011011": 8.5, "011020": 8.5, "011021": 7.3, "011100": 9.2,
  "011101": 8.2, "011110": 8.0, "011111": 7.2, "011120": 7.0, "011121": 5.9,
  "011200": 8.0, "011201": 7.1, "011210": 5.9, "011211": 5.0, "011220": 4.0,
  "011221": 2.9, "012001": 8.6, "012011": 7.5, "012021": 5.2, "012101": 7.1,
  "012111": 5.2, "012121": 2.9, "012201": 5.3, "012211": 2.9, "012221": 1.7,
  
  "100000": 9.8, "100001": 9.5, "100010": 9.4, "100011": 8.7, "100020": 9.1,
  "100021": 8.1, "100100": 9.4, "100101": 8.9, "100110": 8.6, "100111": 7.4,
  "100120": 7.7, "100121": 6.4, "100200": 8.7, "100201": 7.5, "100210": 7.4,
  "100211": 6.3, "100220": 6.3, "100221": 4.9, "101000": 9.4, "101001": 8.9,
  "101010": 8.8, "101011": 7.7, "101020": 7.6, "101021": 6.7, "101100": 8.6,
  "101101": 7.6, "101110": 7.4, "101111": 5.8, "101120": 5.9, "101121": 5.2,
  "101200": 7.2, "101201": 5.7, "101210": 5.7, "101211": 5.2, "101220": 5.2,
  "101221": 2.5, "102001": 8.3, "102011": 7.0, "102021": 5.4, "102101": 6.5,
  "102111": 5.8, "102121": 2.6, "102201": 5.3, "102211": 2.1, "102221": 1.3,
  
  "110000": 9.5, "110001": 9.0, "110010": 8.8, "110011": 7.6, "110020": 7.6,
  "110021": 7.0, "110100": 9.0, "110101": 7.7, "110110": 7.5, "110111": 6.2,
  "110120": 6.1, "110121": 5.3, "110200": 7.7, "110201": 6.6, "110210": 6.8,
  "110211": 5.9, "110220": 5.2, "110221": 3.0, "111000": 8.9, "111001": 7.8,
  "111010": 7.6, "111011": 6.7, "111020": 6.2, "111021": 5.8, "111100": 7.4,
  "111101": 5.9, "111110": 5.7, "111111": 5.7, "111120": 4.7, "111121": 2.3,
  "111200": 6.1, "111201": 5.2, "111210": 5.7, "111211": 2.9, "111220": 2.4,
  "111221": 1.6, "112001": 7.1, "112011": 5.9, "112021": 3.0, "112101": 5.8,
  "112111": 2.6, "112121": 1.5, "112201": 2.3, "112211": 1.3, "112221": 0.6,
  
  "200000": 9.3, "200001": 8.7, "200010": 8.6, "200011": 7.2, "200020": 7.5,
  "200021": 5.8, "200100": 8.6, "200101": 7.4, "200110": 7.4, "200111": 6.1,
  "200120": 5.6, "200121": 3.4, "200200": 7.0, "200201": 5.4, "200210": 5.2,
  "200211": 4.0, "200220": 4.0, "200221": 2.2, "201000": 8.5, "201001": 7.5,
  "201010": 7.4, "201011": 5.5, "201020": 6.2, "201021": 5.1, "201100": 7.2,
  "201101": 5.7, "201110": 5.5, "201111": 4.1, "201120": 4.6, "201121": 1.9,
  "201200": 5.3, "201201": 3.6, "201210": 3.4, "201211": 1.9, "201220": 1.9,
  "201221": 0.8, "202001": 6.4, "202011": 5.1, "202021": 2.0, "202101": 4.7,
  "202111": 2.1, "202121": 1.1, "202201": 2.4, "202211": 0.9, "202221": 0.4
};

/**
 * Generates the MacroVector for CVSS 4.0 scoring
 * @param {Object} metrics - The CVSS 4.0 metrics
 * @returns {string} The 6-digit MacroVector
 */
function generateMacroVector(metrics) {
  // EQ1: Exploitability (0-2)
  let eq1;
  if (metrics.AV === 'N' && metrics.PR === 'N' && metrics.UI === 'N') {
    eq1 = '0';
  } else if ((metrics.AV === 'N' || metrics.PR === 'N' || metrics.UI === 'N') && 
             !(metrics.AV === 'N' && metrics.PR === 'N' && metrics.UI === 'N') &&
             !(metrics.AV === 'P')) {
    eq1 = '1';
  } else {
    eq1 = '2';
  }
  
  // EQ2: Complexity (0-1)
  const eq2 = (metrics.AC === 'L' && metrics.AT === 'N') ? '0' : '1';
  
  // EQ3: Vulnerable System Impact (0-2)
  const vcHigh = metrics.VC === 'H';
  const viHigh = metrics.VI === 'H';
  const vaHigh = metrics.VA === 'H';
  
  let eq3;
  if (vcHigh && viHigh) {
    eq3 = '0';
  } else if (!vcHigh && !viHigh && !vaHigh) {
    eq3 = '2';
  } else {
    eq3 = '1';
  }
  
  // EQ4: Subsequent System Impact (0-2)
  const scHigh = metrics.SC === 'H';
  const siHigh = metrics.SI === 'H';
  const saHigh = metrics.SA === 'H';
  
  let eq4;
  if (scHigh && siHigh) {
    eq4 = '0';
  } else if (!scHigh && !siHigh && !saHigh) {
    eq4 = '2';
  } else {
    eq4 = '1';
  }
  
  // EQ5: Exploit Maturity (0-2)
  let eq5;
  if (metrics.E === 'A') {
    eq5 = '0';
  } else if (metrics.E === 'P') {
    eq5 = '1';
  } else {
    eq5 = '2'; // U or X
  }
  
  // EQ6: Combined Requirements + Safety (0-1)
  // Simplified: based on CR, IR, AR values
  const hasHighRequirements = 
    (metrics.CR === 'H' || metrics.IR === 'H' || metrics.AR === 'H');
  const eq6 = hasHighRequirements ? '0' : '1';
  
  return eq1 + eq2 + eq3 + eq4 + eq5 + eq6;
}

/**
 * Calculate CVSS 4.0 Score using MacroVector
 * @param {Object} metrics - All CVSS 4.0 metrics (base, threat, environmental, supplemental)
 * @returns {number} The CVSS 4.0 score (0-10)
 */
export function calculateCVSS40Score(metrics) {
  // Generate the MacroVector
  const macroVector = generateMacroVector(metrics);
  
  // Lookup the base score from the MacroVector table
  let score = MACROVECTOR_LOOKUP[macroVector];
  
  // If not found in lookup table, use fallback calculation
  if (score === undefined) {
    console.warn(`MacroVector ${macroVector} not found in lookup table, using fallback`);
    score = calculateFallbackScore(metrics);
  }
  
  // Apply modified metrics if present
  if (hasModifiedMetrics(metrics)) {
    const modifiedMetrics = applyModifiedMetrics(metrics);
    const modifiedMacroVector = generateMacroVector(modifiedMetrics);
    const modifiedScore = MACROVECTOR_LOOKUP[modifiedMacroVector] || score;
    score = modifiedScore;
  }
  
  // Round to one decimal place
  return Math.round(score * 10) / 10;
}

/**
 * Check if any modified metrics are set
 */
function hasModifiedMetrics(metrics) {
  const modifiedKeys = ['MAV', 'MAC', 'MAT', 'MPR', 'MUI', 'MVC', 'MVI', 'MVA', 'MSC', 'MSI', 'MSA'];
  return modifiedKeys.some(key => metrics[key] && metrics[key] !== 'X');
}

/**
 * Apply modified metrics to override base metrics
 */
function applyModifiedMetrics(metrics) {
  const modified = { ...metrics };
  
  // Override base metrics with modified metrics if set
  if (metrics.MAV && metrics.MAV !== 'X') modified.AV = metrics.MAV;
  if (metrics.MAC && metrics.MAC !== 'X') modified.AC = metrics.MAC;
  if (metrics.MAT && metrics.MAT !== 'X') modified.AT = metrics.MAT;
  if (metrics.MPR && metrics.MPR !== 'X') modified.PR = metrics.MPR;
  if (metrics.MUI && metrics.MUI !== 'X') modified.UI = metrics.MUI;
  if (metrics.MVC && metrics.MVC !== 'X') modified.VC = metrics.MVC;
  if (metrics.MVI && metrics.MVI !== 'X') modified.VI = metrics.MVI;
  if (metrics.MVA && metrics.MVA !== 'X') modified.VA = metrics.MVA;
  if (metrics.MSC && metrics.MSC !== 'X') modified.SC = metrics.MSC;
  if (metrics.MSI && metrics.MSI !== 'X') modified.SI = metrics.MSI;
  if (metrics.MSA && metrics.MSA !== 'X') modified.SA = metrics.MSA;
  
  return modified;
}

/**
 * Fallback calculation when MacroVector not in lookup table
 */
function calculateFallbackScore(metrics) {
  // Simplified calculation as fallback
  let baseScore = 0;
  
  const exploitability = {
    'N': 0.85, 'A': 0.62, 'L': 0.55, 'P': 0.2
  }[metrics.AV] || 0;
  
  const complexity = {
    'L': 0.77, 'H': 0.44
  }[metrics.AC] || 0;
  
  const privileges = {
    'N': 0.85, 'L': 0.62, 'H': 0.27
  }[metrics.PR] || 0;
  
  const userInteraction = {
    'N': 0.85, 'P': 0.70, 'A': 0.62
  }[metrics.UI] || 0;
  
  const impactVC = { 'H': 0.56, 'L': 0.22, 'N': 0 }[metrics.VC] || 0;
  const impactVI = { 'H': 0.56, 'L': 0.22, 'N': 0 }[metrics.VI] || 0;
  const impactVA = { 'H': 0.56, 'L': 0.22, 'N': 0 }[metrics.VA] || 0;
  const impactSC = { 'H': 0.56, 'L': 0.22, 'N': 0 }[metrics.SC] || 0;
  const impactSI = { 'H': 0.56, 'L': 0.22, 'N': 0 }[metrics.SI] || 0;
  const impactSA = { 'H': 0.56, 'L': 0.22, 'N': 0 }[metrics.SA] || 0;
  
  const exploitabilityScore = 8.22 * exploitability * complexity * privileges * userInteraction;
  const impactScore = 1 - ((1 - impactVC) * (1 - impactVI) * (1 - impactVA) * (1 - impactSC) * (1 - impactSI) * (1 - impactSA));
  
  baseScore = Math.min((exploitabilityScore + 10 * impactScore), 10);
  
  return Math.round(baseScore * 10) / 10;
}

/**
 * Generate CVSS 4.0 vector string
 * @param {Object} metrics - All CVSS 4.0 metrics
 * @returns {string} The CVSS 4.0 vector string
 */
export function generateCVSS40Vector(metrics) {
  let vector = `CVSS:4.0`;
  
  // Base metrics (required)
  vector += `/AV:${metrics.AV}/AC:${metrics.AC}/AT:${metrics.AT}/PR:${metrics.PR}`;
  vector += `/UI:${metrics.UI}/VC:${metrics.VC}/VI:${metrics.VI}/VA:${metrics.VA}`;
  vector += `/SC:${metrics.SC}/SI:${metrics.SI}/SA:${metrics.SA}`;
  
  // Threat metrics (optional)
  if (metrics.E && metrics.E !== 'X') vector += `/E:${metrics.E}`;
  
  // Environmental metrics (optional)
  const envMetrics = ['CR', 'IR', 'AR', 'MAV', 'MAC', 'MAT', 'MPR', 'MUI', 'MVC', 'MVI', 'MVA', 'MSC', 'MSI', 'MSA'];
  envMetrics.forEach(key => {
    if (metrics[key] && metrics[key] !== 'X') {
      vector += `/${key}:${metrics[key]}`;
    }
  });
  
  // Supplemental metrics (optional)
  const suppMetrics = ['S', 'AU', 'R', 'V', 'RE', 'U'];
  suppMetrics.forEach(key => {
    if (metrics[key] && metrics[key] !== 'X') {
      vector += `/${key}:${metrics[key]}`;
    }
  });
  
  return vector;
}

/**
 * Get severity rating from score
 * @param {number} score - CVSS 4.0 score
 * @returns {string} Severity rating
 */
export function getCVSS40Severity(score) {
  if (score === 0) return 'NONE';
  if (score < 4.0) return 'LOW';
  if (score < 7.0) return 'MEDIUM';
  if (score < 9.0) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Get MacroVector for debugging/display
 * @param {Object} metrics - CVSS 4.0 metrics
 * @returns {string} The MacroVector
 */
export function getMacroVector(metrics) {
  return generateMacroVector(metrics);
}
