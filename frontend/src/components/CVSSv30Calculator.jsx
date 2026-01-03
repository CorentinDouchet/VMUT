import { useState, useEffect, useRef } from 'react';

// ==================== CVSS v3.0 METRICS DEFINITIONS ====================
// Based on official FIRST specification: https://www.first.org/cvss/v3-0/specification-document

// Metric group descriptions from FIRST.org
const METRIC_DESCRIPTIONS_V30 = {
  'Attack Vector': 'This metric reflects the context by which vulnerability exploitation is possible. This metric value (and consequently the Base score) will be larger the more remote (logically, and physically) an attacker can be in order to exploit the vulnerable component.',
  'Attack Complexity': 'This metric describes the conditions beyond the attacker\'s control that must exist in order to exploit the vulnerability. Such conditions may require the collection of more information about the target, the presence of certain system configuration settings, or computational exceptions.',
  'Privileges Required': 'This metric describes the level of privileges an attacker must possess before successfully exploiting the vulnerability.',
  'User Interaction': 'This metric captures the requirement for a user, other than the attacker, to participate in the successful compromise of the vulnerable component. This metric determines whether the vulnerability can be exploited solely at the will of the attacker, or whether a separate user (or user-initiated process) must participate in some manner.',
  'Scope': 'An important property captured by CVSS v3.0 is the ability for a vulnerability in one software component to impact resources beyond its means, or privileges. This metric captures whether a vulnerability in one vulnerable component impacts resources in components beyond its security scope.',
  'Confidentiality': 'This metric measures the impact to the confidentiality of the information resources managed by a software component due to a successfully exploited vulnerability. Confidentiality refers to limiting information access and disclosure to only authorized users, as well as preventing access by, or disclosure to, unauthorized ones.',
  'Confidentiality Impact': 'This metric measures the impact to the confidentiality of the information resources managed by a software component due to a successfully exploited vulnerability. Confidentiality refers to limiting information access and disclosure to only authorized users, as well as preventing access by, or disclosure to, unauthorized ones.',
  'Integrity': 'This metric measures the impact to integrity of a successfully exploited vulnerability. Integrity refers to the trustworthiness and veracity of information.',
  'Integrity Impact': 'This metric measures the impact to integrity of a successfully exploited vulnerability. Integrity refers to the trustworthiness and veracity of information.',
  'Availability': 'This metric measures the impact to the availability of the impacted component resulting from a successfully exploited vulnerability. It refers to the loss of availability of the impacted component itself, such as a networked service (e.g., web, database, email).',
  'Availability Impact': 'This metric measures the impact to the availability of the impacted component resulting from a successfully exploited vulnerability. It refers to the loss of availability of the impacted component itself, such as a networked service (e.g., web, database, email).',
  'Exploit Code Maturity': 'This metric measures the likelihood of the vulnerability being attacked, and is typically based on the current state of exploit techniques, exploit code availability, or active, "in-the-wild" exploitation.',
  'Remediation Level': 'The Remediation Level of a vulnerability is an important factor for prioritization. The typical vulnerability is unpatched when initially published. Workarounds or hotfixes may offer interim remediation until an official patch or upgrade is issued.',
  'Report Confidence': 'This metric measures the degree of confidence in the existence of the vulnerability and the credibility of the known technical details. Sometimes only the existence of vulnerabilities are publicized, but without specific details.',
  'Confidentiality Requirement': 'These metrics enable the analyst to customize the CVSS score depending on the importance of the affected IT asset to a user\'s organization, measured in terms of confidentiality.',
  'Integrity Requirement': 'These metrics enable the analyst to customize the CVSS score depending on the importance of the affected IT asset to a user\'s organization, measured in terms of integrity.',
  'Availability Requirement': 'These metrics enable the analyst to customize the CVSS score depending on the importance of the affected IT asset to a user\'s organization, measured in terms of availability.',
  'Modified Attack Vector': 'These metrics enable the analyst to override individual Base metrics based on specific characteristics of a user\'s environment. This metric reflects the context by which vulnerability exploitation is possible in the analyst\'s environment.',
  'Modified Attack Complexity': 'This metric reflects the complexity of the attack in the analyst\'s environment, and captures the conditions beyond the attacker\'s control that must exist in order to exploit the vulnerability.',
  'Modified Privileges Required': 'This metric reflects the level of privileges an attacker must possess before successfully exploiting the vulnerability in the analyst\'s environment.',
  'Modified User Interaction': 'This metric captures the requirement for a user to participate in the successful compromise of the vulnerable component in the analyst\'s environment.',
  'Modified Scope': 'This metric captures whether a vulnerability in one vulnerable component impacts resources in components beyond its security scope in the analyst\'s environment.',
  'Modified Confidentiality': 'This metric measures the impact to the confidentiality of the information resources managed by a software component in the analyst\'s environment.',
  'Modified Confidentiality Impact': 'This metric measures the impact to the confidentiality of the information resources managed by a software component in the analyst\'s environment.',
  'Modified Integrity': 'This metric measures the impact to integrity of a successfully exploited vulnerability in the analyst\'s environment.',
  'Modified Integrity Impact': 'This metric measures the impact to integrity of a successfully exploited vulnerability in the analyst\'s environment.',
  'Modified Availability': 'This metric measures the impact to the availability of the impacted component in the analyst\'s environment.',
  'Modified Availability Impact': 'This metric measures the impact to the availability of the impacted component in the analyst\'s environment.'
};

const CVSS_V30_METRICS = {
  // BASE SCORE METRICS
  base: {
    AV: {
      name: 'Attack Vector',
      short: 'AV',
      category: 'Exploitability',
      options: [
        { 
          value: 'N', 
          label: 'Network', 
          metric: 0.85,
          desc: 'The vulnerable component is bound to the network stack and the attacker\'s path is through OSI layer 3 (the network layer). Such a vulnerability is often termed "remotely exploitable" and can be thought of as an attack being exploitable one or more network hops away.'
        },
        { 
          value: 'A', 
          label: 'Adjacent', 
          metric: 0.62,
          desc: 'The vulnerable component is bound to the network stack, however the attack is limited to the same shared physical (e.g. Bluetooth, IEEE 802.11) or logical (e.g. local IP subnet) network, and cannot be performed across an OSI layer 3 boundary (e.g. a router).'
        },
        { 
          value: 'L', 
          label: 'Local', 
          metric: 0.55,
          desc: 'The vulnerable component is not bound to the network stack, and the attacker\'s path is via read/write/execute capabilities. In some cases, the attacker may be logged in locally in order to exploit the vulnerability, otherwise, she may rely on User Interaction to execute a malicious file.'
        },
        { 
          value: 'P', 
          label: 'Physical', 
          metric: 0.2,
          desc: 'The attack requires the attacker to physically touch or manipulate the vulnerable component. Physical interaction may be brief (e.g. evil maid attack) or persistent. An example is a cold boot attack which allows access to disk encryption keys after gaining physical access.'
        }
      ]
    },
    AC: {
      name: 'Attack Complexity',
      short: 'AC',
      category: 'Exploitability',
      options: [
        { 
          value: 'L', 
          label: 'Low', 
          metric: 0.77,
          desc: 'Specialized access conditions or extenuating circumstances do not exist. An attacker can expect repeatable success against the vulnerable component.'
        },
        { 
          value: 'H', 
          label: 'High', 
          metric: 0.44,
          desc: 'A successful attack depends on conditions beyond the attacker\'s control. That is, a successful attack cannot be accomplished at will, but requires the attacker to invest in some measurable amount of effort in preparation or execution before a successful attack can be expected.'
        }
      ]
    },
    PR: {
      name: 'Privileges Required',
      short: 'PR',
      category: 'Exploitability',
      options: [
        { 
          value: 'N', 
          label: 'None', 
          metricUnchanged: 0.85,
          metricChanged: 0.85,
          desc: 'The attacker is unauthorized prior to attack, and therefore does not require any access to settings or files to carry out an attack.'
        },
        { 
          value: 'L', 
          label: 'Low', 
          metricUnchanged: 0.62,
          metricChanged: 0.68,
          desc: 'The attacker is authorized with (i.e. requires) privileges that provide basic user capabilities that could normally affect only settings and files owned by a user. Alternatively, an attacker with Low privileges may have the ability to cause an impact only to non-sensitive resources.'
        },
        { 
          value: 'H', 
          label: 'High', 
          metricUnchanged: 0.27,
          metricChanged: 0.5,
          desc: 'The attacker is authorized with (i.e. requires) privileges that provide significant (e.g. administrative) control over the vulnerable component that could affect component-wide settings and files.'
        }
      ]
    },
    UI: {
      name: 'User Interaction',
      short: 'UI',
      category: 'Exploitability',
      options: [
        { 
          value: 'N', 
          label: 'None', 
          metric: 0.85,
          desc: 'The vulnerable system can be exploited without interaction from any user.'
        },
        { 
          value: 'R', 
          label: 'Required', 
          metric: 0.62,
          desc: 'Successful exploitation of this vulnerability requires a user to take some action before the vulnerability can be exploited. For example, a successful exploit may only be possible during the installation of an application by a system administrator.'
        }
      ]
    },
    S: {
      name: 'Scope',
      short: 'S',
      category: 'Impact',
      options: [
        { 
          value: 'U', 
          label: 'Unchanged', 
          desc: 'An exploited vulnerability can only affect resources managed by the same authority. In this case the vulnerable component and the impacted component are the same.'
        },
        { 
          value: 'C', 
          label: 'Changed', 
          desc: 'An exploited vulnerability can affect resources beyond the authorization privileges intended by the vulnerable component. In this case the vulnerable component and the impacted component are different.'
        }
      ]
    },
    C: {
      name: 'Confidentiality Impact',
      short: 'C',
      category: 'Impact',
      options: [
        { 
          value: 'H', 
          label: 'High', 
          metric: 0.56,
          desc: 'There is total loss of confidentiality, resulting in all resources within the impacted component being divulged to the attacker. Alternatively, access to only some restricted information is obtained, but the disclosed information presents a direct, serious impact.'
        },
        { 
          value: 'L', 
          label: 'Low', 
          metric: 0.22,
          desc: 'There is some loss of confidentiality. Access to some restricted information is obtained, but the attacker does not have control over what information is obtained, or the amount or kind of loss is constrained. The information disclosure does not cause a direct, serious loss to the impacted component.'
        },
        { 
          value: 'N', 
          label: 'None', 
          metric: 0,
          desc: 'There is no loss of confidentiality within the impacted component.'
        }
      ]
    },
    I: {
      name: 'Integrity Impact',
      short: 'I',
      category: 'Impact',
      options: [
        { 
          value: 'H', 
          label: 'High', 
          metric: 0.56,
          desc: 'There is a total loss of integrity, or a complete loss of protection. For example, the attacker is able to modify any/all files protected by the impacted component. Alternatively, only some files can be modified, but malicious modification would present a direct, serious consequence to the impacted component.'
        },
        { 
          value: 'L', 
          label: 'Low', 
          metric: 0.22,
          desc: 'Modification of data is possible, but the attacker does not have control over the consequence of a modification, or the amount of modification is constrained. The data modification does not have a direct, serious impact on the impacted component.'
        },
        { 
          value: 'N', 
          label: 'None', 
          metric: 0,
          desc: 'There is no loss of integrity within the impacted component.'
        }
      ]
    },
    A: {
      name: 'Availability Impact',
      short: 'A',
      category: 'Impact',
      options: [
        { 
          value: 'H', 
          label: 'High', 
          metric: 0.56,
          desc: 'There is total loss of availability, resulting in the attacker being able to fully deny access to resources in the impacted component; this loss is either sustained (while the attacker continues to deliver the attack) or persistent (the condition persists even after the attack has completed).'
        },
        { 
          value: 'L', 
          label: 'Low', 
          metric: 0.22,
          desc: 'There is reduced performance or interruptions in resource availability. Even if repeated exploitation of the vulnerability is possible, the attacker does not have the ability to completely deny service to legitimate users. The resources in the impacted component are either partially available all of the time, or fully available only some of the time.'
        },
        { 
          value: 'N', 
          label: 'None', 
          metric: 0,
          desc: 'There is no impact to availability within the impacted component.'
        }
      ]
    }
  },

  // TEMPORAL METRICS
  temporal: {
    E: {
      name: 'Exploit Code Maturity',
      short: 'E',
      options: [
        { value: 'X', label: 'Not Defined', metric: 1.0, desc: 'Assigning this value will not influence the score.' },
        { value: 'H', label: 'High', metric: 1.0, desc: 'Functional autonomous code exists, or no exploit is required (manual trigger). Exploit code works in every situation, or is actively being delivered via an autonomous agent (such as a worm or virus).' },
        { value: 'F', label: 'Functional', metric: 0.97, desc: 'Functional exploit code is available. The code works in most situations where the vulnerability exists.' },
        { value: 'P', label: 'Proof-of-Concept', metric: 0.94, desc: 'Proof-of-concept exploit code is available, or an attack demonstration is not practical for most systems.' },
        { value: 'U', label: 'Unproven', metric: 0.91, desc: 'No exploit code is available, or an exploit is theoretical.' }
      ]
    },
    RL: {
      name: 'Remediation Level',
      short: 'RL',
      options: [
        { value: 'X', label: 'Not Defined', metric: 1.0, desc: 'Assigning this value will not influence the score.' },
        { value: 'U', label: 'Unavailable', metric: 1.0, desc: 'There is either no solution available or it is impossible to apply.' },
        { value: 'W', label: 'Workaround', metric: 0.97, desc: 'There is an unofficial, non-vendor solution available.' },
        { value: 'T', label: 'Temporary Fix', metric: 0.96, desc: 'There is an official but temporary fix available.' },
        { value: 'O', label: 'Official Fix', metric: 0.95, desc: 'A complete vendor solution is available. Either the vendor has issued an official patch, or an upgrade is available.' }
      ]
    },
    RC: {
      name: 'Report Confidence',
      short: 'RC',
      options: [
        { value: 'X', label: 'Not Defined', metric: 1.0, desc: 'Assigning this value will not influence the score.' },
        { value: 'C', label: 'Confirmed', metric: 1.0, desc: 'Detailed reports exist, or functional reproduction is possible (functional exploits may provide this).' },
        { value: 'R', label: 'Reasonable', metric: 0.96, desc: 'Significant details are published, but researchers either do not have full confidence in the root cause, or do not have access to source code to fully confirm all interactions.' },
        { value: 'U', label: 'Unknown', metric: 0.92, desc: 'There are reports of impacts that indicate a vulnerability is present, but reporters are uncertain of the true nature of the vulnerability.' }
      ]
    }
  },

  // ENVIRONMENTAL METRICS
  environmental: {
    CR: {
      name: 'Confidentiality Requirement',
      short: 'CR',
      options: [
        { value: 'X', label: 'Not Defined', metric: 1.0, desc: 'Assigning this value will not influence the score.' },
        { value: 'H', label: 'High', metric: 1.5, desc: 'Loss of Confidentiality is likely to have a catastrophic adverse effect on the organization or individuals.' },
        { value: 'M', label: 'Medium', metric: 1.0, desc: 'Loss of Confidentiality is likely to have a serious adverse effect on the organization or individuals.' },
        { value: 'L', label: 'Low', metric: 0.5, desc: 'Loss of Confidentiality is likely to have only a limited adverse effect on the organization or individuals.' }
      ]
    },
    IR: {
      name: 'Integrity Requirement',
      short: 'IR',
      options: [
        { value: 'X', label: 'Not Defined', metric: 1.0, desc: 'Assigning this value will not influence the score.' },
        { value: 'H', label: 'High', metric: 1.5, desc: 'Loss of Integrity is likely to have a catastrophic adverse effect on the organization or individuals.' },
        { value: 'M', label: 'Medium', metric: 1.0, desc: 'Loss of Integrity is likely to have a serious adverse effect on the organization or individuals.' },
        { value: 'L', label: 'Low', metric: 0.5, desc: 'Loss of Integrity is likely to have only a limited adverse effect on the organization or individuals.' }
      ]
    },
    AR: {
      name: 'Availability Requirement',
      short: 'AR',
      options: [
        { value: 'X', label: 'Not Defined', metric: 1.0, desc: 'Assigning this value will not influence the score.' },
        { value: 'H', label: 'High', metric: 1.5, desc: 'Loss of Availability is likely to have a catastrophic adverse effect on the organization or individuals.' },
        { value: 'M', label: 'Medium', metric: 1.0, desc: 'Loss of Availability is likely to have a serious adverse effect on the organization or individuals.' },
        { value: 'L', label: 'Low', metric: 0.5, desc: 'Loss of Availability is likely to have only a limited adverse effect on the organization or individuals.' }
      ]
    },
    MAV: {
      name: 'Modified Attack Vector',
      short: 'MAV',
      options: [
        { value: 'X', label: 'Not Defined', metric: null, desc: 'Use the same value as Attack Vector' },
        { value: 'N', label: 'Network', metric: 0.85, desc: 'Same as Attack Vector: Network' },
        { value: 'A', label: 'Adjacent', metric: 0.62, desc: 'Same as Attack Vector: Adjacent' },
        { value: 'L', label: 'Local', metric: 0.55, desc: 'Same as Attack Vector: Local' },
        { value: 'P', label: 'Physical', metric: 0.2, desc: 'Same as Attack Vector: Physical' }
      ]
    },
    MAC: {
      name: 'Modified Attack Complexity',
      short: 'MAC',
      options: [
        { value: 'X', label: 'Not Defined', metric: null, desc: 'Use the same value as Attack Complexity' },
        { value: 'L', label: 'Low', metric: 0.77, desc: 'Same as Attack Complexity: Low' },
        { value: 'H', label: 'High', metric: 0.44, desc: 'Same as Attack Complexity: High' }
      ]
    },
    MPR: {
      name: 'Modified Privileges Required',
      short: 'MPR',
      options: [
        { value: 'X', label: 'Not Defined', metric: null, desc: 'Use the same value as Privileges Required' },
        { value: 'N', label: 'None', metricUnchanged: 0.85, metricChanged: 0.85, desc: 'Same as Privileges Required: None' },
        { value: 'L', label: 'Low', metricUnchanged: 0.62, metricChanged: 0.68, desc: 'Same as Privileges Required: Low' },
        { value: 'H', label: 'High', metricUnchanged: 0.27, metricChanged: 0.5, desc: 'Same as Privileges Required: High' }
      ]
    },
    MUI: {
      name: 'Modified User Interaction',
      short: 'MUI',
      options: [
        { value: 'X', label: 'Not Defined', metric: null, desc: 'Use the same value as User Interaction' },
        { value: 'N', label: 'None', metric: 0.85, desc: 'Same as User Interaction: None' },
        { value: 'R', label: 'Required', metric: 0.62, desc: 'Same as User Interaction: Required' }
      ]
    },
    MS: {
      name: 'Modified Scope',
      short: 'MS',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'Use the same value as Scope' },
        { value: 'U', label: 'Unchanged', desc: 'Same as Scope: Unchanged' },
        { value: 'C', label: 'Changed', desc: 'Same as Scope: Changed' }
      ]
    },
    MC: {
      name: 'Modified Confidentiality',
      short: 'MC',
      options: [
        { value: 'X', label: 'Not Defined', metric: null, desc: 'Use the same value as Confidentiality' },
        { value: 'H', label: 'High', metric: 0.56, desc: 'Same as Confidentiality: High' },
        { value: 'L', label: 'Low', metric: 0.22, desc: 'Same as Confidentiality: Low' },
        { value: 'N', label: 'None', metric: 0, desc: 'Same as Confidentiality: None' }
      ]
    },
    MI: {
      name: 'Modified Integrity',
      short: 'MI',
      options: [
        { value: 'X', label: 'Not Defined', metric: null, desc: 'Use the same value as Integrity' },
        { value: 'H', label: 'High', metric: 0.56, desc: 'Same as Integrity: High' },
        { value: 'L', label: 'Low', metric: 0.22, desc: 'Same as Integrity: Low' },
        { value: 'N', label: 'None', metric: 0, desc: 'Same as Integrity: None' }
      ]
    },
    MA: {
      name: 'Modified Availability',
      short: 'MA',
      options: [
        { value: 'X', label: 'Not Defined', metric: null, desc: 'Use the same value as Availability' },
        { value: 'H', label: 'High', metric: 0.56, desc: 'Same as Availability: High' },
        { value: 'L', label: 'Low', metric: 0.22, desc: 'Same as Availability: Low' },
        { value: 'N', label: 'None', metric: 0, desc: 'Same as Availability: None' }
      ]
    }
  }
};

// ==================== CVSS v3.0 CALCULATOR COMPONENT ====================

function CVSSv30Calculator({ vulnerability, onSave, onClose }) {
  const [baseMetrics, setBaseMetrics] = useState({
    AV: null, AC: null, PR: null, UI: null, S: null, C: null, I: null, A: null
  });
  const [temporalMetrics, setTemporalMetrics] = useState({
    E: 'X', RL: 'X', RC: 'X'
  });
  const [environmentalMetrics, setEnvironmentalMetrics] = useState({
    CR: 'X', IR: 'X', AR: 'X',
    MAV: 'X', MAC: 'X', MPR: 'X', MUI: 'X', MS: 'X', MC: 'X', MI: 'X', MA: 'X'
  });
  
  const [scores, setScores] = useState({ base: 0, temporal: 0, environmental: 0 });
  const [severities, setSeverities] = useState({ base: 'NONE', temporal: 'NONE', environmental: 'NONE' });
  
  const baseScoreRef = useRef(null);
  const temporalScoreRef = useRef(null);
  const environmentalScoreRef = useRef(null);

  const handleSave = () => {
    if (onSave) {
      const vectorString = generateVector();
      onSave({
        cvssVersion: '3.0',
        baseScore: scores.base,
        baseSeverity: severities.base,
        temporalScore: scores.temporal,
        environmentalScore: scores.environmental,
        vectorString: vectorString
      });
    }
    onClose();
  };

  const getSeverityColor = (severity) => {
    const severityMap = {
      'NONE': '#94a3b8',
      'LOW': '#22c55e',
      'MEDIUM': '#eab308',
      'HIGH': '#f97316',
      'CRITICAL': '#ef4444'
    };
    return severityMap[severity?.toUpperCase()] || '#94a3b8';
  };

  const generateVector = () => {
    const parts = ['CVSS:3.0'];
    
    // Base metrics
    if (baseMetrics.AV) parts.push(`AV:${baseMetrics.AV}`);
    if (baseMetrics.AC) parts.push(`AC:${baseMetrics.AC}`);
    if (baseMetrics.PR) parts.push(`PR:${baseMetrics.PR}`);
    if (baseMetrics.UI) parts.push(`UI:${baseMetrics.UI}`);
    if (baseMetrics.S) parts.push(`S:${baseMetrics.S}`);
    if (baseMetrics.C) parts.push(`C:${baseMetrics.C}`);
    if (baseMetrics.I) parts.push(`I:${baseMetrics.I}`);
    if (baseMetrics.A) parts.push(`A:${baseMetrics.A}`);
    
    // Temporal metrics
    if (temporalMetrics.E && temporalMetrics.E !== 'X') parts.push(`E:${temporalMetrics.E}`);
    if (temporalMetrics.RL && temporalMetrics.RL !== 'X') parts.push(`RL:${temporalMetrics.RL}`);
    if (temporalMetrics.RC && temporalMetrics.RC !== 'X') parts.push(`RC:${temporalMetrics.RC}`);
    
    // Environmental metrics
    if (environmentalMetrics.CR && environmentalMetrics.CR !== 'X') parts.push(`CR:${environmentalMetrics.CR}`);
    if (environmentalMetrics.IR && environmentalMetrics.IR !== 'X') parts.push(`IR:${environmentalMetrics.IR}`);
    if (environmentalMetrics.AR && environmentalMetrics.AR !== 'X') parts.push(`AR:${environmentalMetrics.AR}`);
    if (environmentalMetrics.MAV && environmentalMetrics.MAV !== 'X') parts.push(`MAV:${environmentalMetrics.MAV}`);
    if (environmentalMetrics.MAC && environmentalMetrics.MAC !== 'X') parts.push(`MAC:${environmentalMetrics.MAC}`);
    if (environmentalMetrics.MPR && environmentalMetrics.MPR !== 'X') parts.push(`MPR:${environmentalMetrics.MPR}`);
    if (environmentalMetrics.MUI && environmentalMetrics.MUI !== 'X') parts.push(`MUI:${environmentalMetrics.MUI}`);
    if (environmentalMetrics.MS && environmentalMetrics.MS !== 'X') parts.push(`MS:${environmentalMetrics.MS}`);
    if (environmentalMetrics.MC && environmentalMetrics.MC !== 'X') parts.push(`MC:${environmentalMetrics.MC}`);
    if (environmentalMetrics.MI && environmentalMetrics.MI !== 'X') parts.push(`MI:${environmentalMetrics.MI}`);
    if (environmentalMetrics.MA && environmentalMetrics.MA !== 'X') parts.push(`MA:${environmentalMetrics.MA}`);
    
    return parts.join('/');
  };


  // Calculate scores when metrics change
  useEffect(() => {
    calculateScores();
  }, [baseMetrics, temporalMetrics, environmentalMetrics]);

  const roundUp = (value) => {
    return Math.ceil(value * 10) / 10;
  };

  const getSeverity = (score) => {
    if (score === 0) return 'NONE';
    if (score < 4.0) return 'LOW';
    if (score < 7.0) return 'MEDIUM';
    if (score < 9.0) return 'HIGH';
    return 'CRITICAL';
  };

  const calculateScores = () => {
    // Check if all base metrics are defined
    const allBaseDefined = Object.values(baseMetrics).every(v => v !== null);
    
    if (!allBaseDefined) {
      setScores({ base: 0, temporal: 0, environmental: 0 });
      setSeverities({ base: 'NONE', temporal: 'NONE', environmental: 'NONE' });
      return;
    }

    // Get metric values
    const AV = CVSS_V30_METRICS.base.AV.options.find(o => o.value === baseMetrics.AV)?.metric || 0;
    const AC = CVSS_V30_METRICS.base.AC.options.find(o => o.value === baseMetrics.AC)?.metric || 0;
    const UI = CVSS_V30_METRICS.base.UI.options.find(o => o.value === baseMetrics.UI)?.metric || 0;
    
    const scope = baseMetrics.S;
    const PR = CVSS_V30_METRICS.base.PR.options.find(o => o.value === baseMetrics.PR)?.[scope === 'C' ? 'metricChanged' : 'metricUnchanged'] || 0;
    
    const C = CVSS_V30_METRICS.base.C.options.find(o => o.value === baseMetrics.C)?.metric || 0;
    const I = CVSS_V30_METRICS.base.I.options.find(o => o.value === baseMetrics.I)?.metric || 0;
    const A = CVSS_V30_METRICS.base.A.options.find(o => o.value === baseMetrics.A)?.metric || 0;

    // Calculate ISCBase
    const ISCBase = 1 - ((1 - C) * (1 - I) * (1 - A));

    // Calculate Impact
    let impact;
    if (scope === 'U') {
      impact = 6.42 * ISCBase;
    } else {
      impact = 7.52 * (ISCBase - 0.029) - 3.25 * Math.pow(ISCBase - 0.02, 15);
    }

    // Calculate Exploitability
    const exploitability = 8.22 * AV * AC * PR * UI;

    // Calculate Base Score
    let baseScore;
    if (impact <= 0) {
      baseScore = 0;
    } else if (scope === 'U') {
      baseScore = roundUp(Math.min(impact + exploitability, 10));
    } else {
      baseScore = roundUp(Math.min(1.08 * (impact + exploitability), 10));
    }

    // Calculate Temporal Score
    const E = CVSS_V30_METRICS.temporal.E.options.find(o => o.value === temporalMetrics.E)?.metric || 1;
    const RL = CVSS_V30_METRICS.temporal.RL.options.find(o => o.value === temporalMetrics.RL)?.metric || 1;
    const RC = CVSS_V30_METRICS.temporal.RC.options.find(o => o.value === temporalMetrics.RC)?.metric || 1;
    const temporalScore = roundUp(baseScore * E * RL * RC);

    // Calculate Environmental Score (simplified for now)
    const environmentalScore = temporalScore;

    setScores({
      base: baseScore,
      temporal: temporalScore,
      environmental: environmentalScore
    });
    
    setSeverities({
      base: getSeverity(baseScore),
      temporal: getSeverity(temporalScore),
      environmental: getSeverity(environmentalScore)
    });
  };

  // Custom Tooltip Component
  const MetricTooltip = ({ text, children }) => {
    const [show, setShow] = useState(false);
    return (
      <span 
        className="metric-tooltip-wrapper"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
        {show && text && (
          <div className="cvss-custom-tooltip">
            {text}
          </div>
        )}
      </span>
    );
  };

  const renderMetric = (key, metricsGroup, setMetricsFunc) => {
    const metric = metricsGroup[key];
    const selected = setMetricsFunc === setBaseMetrics ? baseMetrics[key] 
                   : setMetricsFunc === setTemporalMetrics ? temporalMetrics[key]
                   : environmentalMetrics[key];
    const metricDescription = METRIC_DESCRIPTIONS_V30[metric.name];

    return (
      <div key={key} className="cvss-metric-group">
        <MetricTooltip text={metricDescription}>
          <div className="cvss-metric-label">
            {metric.name} <span className="metric-short">({metric.short})</span>
          </div>
        </MetricTooltip>
        <div className="cvss-metric-options">
          {metric.options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`cvss-option ${selected === option.value ? 'active' : ''}`}
              onClick={() => setMetricsFunc(prev => ({ ...prev, [key]: option.value }))}
            >
              <div className="option-value">{option.value}</div>
              <div className="option-label">{option.label}</div>
              {option.desc && (
                <div className="cvss-metric-tooltip">
                  {option.desc}
                  <div className="tooltip-arrow"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-xlarge cvss-calculator" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header flex-col gap-4">
          <div className="flex justify-between items-center w-full">
            <div>
              <h2>🧮 Calculateur CVSS v3.0</h2>
              <p className="modal-subtitle">
                Common Vulnerability Scoring System Version 3.0
                {Object.values(baseMetrics).every(v => v !== null) && (
                  <span className="live-score-indicator">
                    Score en temps réel
                  </span>
                )}
              </p>
            </div>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>

          {/* Score Display */}
          <div className="cvss-scores-display four-cols w-full">
            <div className="score-card">
              <div className="score-card-header">Score Original</div>
              <div className="score-card-body">
                <div className="score-value original">{vulnerability.baseScore || vulnerability.score || 'N/A'}</div>
                <div className="score-severity" style={{ backgroundColor: getSeverityColor(vulnerability.baseSeverity || vulnerability.severity) }}>
                  {vulnerability.baseSeverity || vulnerability.severity || 'NONE'}
                </div>
              </div>
            </div>

            <div className="score-card primary">
              <div className="score-card-header">Base Score</div>
              <div className="score-card-body">
                <div className="score-value" ref={baseScoreRef}>{scores.base.toFixed(1)}</div>
                <div className="score-severity" style={{ backgroundColor: getSeverityColor(severities.base) }}>
                  {severities.base}
                </div>
              </div>
            </div>

            <div className="score-card">
              <div className="score-card-header">Temporal Score</div>
              <div className="score-card-body">
                <div className="score-value" ref={temporalScoreRef}>{scores.temporal.toFixed(1)}</div>
                <div className="score-severity" style={{ backgroundColor: getSeverityColor(severities.temporal) }}>
                  {severities.temporal}
                </div>
              </div>
            </div>

            <div className="score-card">
              <div className="score-card-header">Environmental Score</div>
              <div className="score-card-body">
                <div className="score-value" ref={environmentalScoreRef}>{scores.environmental.toFixed(1)}</div>
                <div className="score-severity" style={{ backgroundColor: getSeverityColor(severities.environmental) }}>
                  {severities.environmental}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-body">
          {/* CVE Info */}
          <div className="cvss-cve-info mb-4">
            <strong>{vulnerability.cveId}</strong> - {vulnerability.packageName}
            {Object.values(baseMetrics).every(v => v !== null) && (
              <div className="cvss-vector">{generateVector()}</div>
            )}
          </div>

          <div className="cvss-calculator-grid v3">
            {/* Column 1: Base Metrics */}
            <div className="cvss-column">
              <div className="cvss-group-container">
                <div className="cvss-group-header">Base Metrics</div>
                
                <div className="cvss-sub-group-header">Exploitability</div>
                {renderMetric('AV', CVSS_V30_METRICS.base, setBaseMetrics)}
                {renderMetric('AC', CVSS_V30_METRICS.base, setBaseMetrics)}
                {renderMetric('PR', CVSS_V30_METRICS.base, setBaseMetrics)}
                {renderMetric('UI', CVSS_V30_METRICS.base, setBaseMetrics)}
                
                <div className="cvss-sub-group-header">Scope</div>
                {renderMetric('S', CVSS_V30_METRICS.base, setBaseMetrics)}
                
                <div className="cvss-sub-group-header">Impact</div>
                {renderMetric('C', CVSS_V30_METRICS.base, setBaseMetrics)}
                {renderMetric('I', CVSS_V30_METRICS.base, setBaseMetrics)}
                {renderMetric('A', CVSS_V30_METRICS.base, setBaseMetrics)}
              </div>
            </div>

            {/* Column 2: Temporal Metrics */}
            <div className="cvss-column">
              <div className="cvss-group-container">
                <div className="cvss-group-header">Temporal Metrics</div>
                {renderMetric('E', CVSS_V30_METRICS.temporal, setTemporalMetrics)}
                {renderMetric('RL', CVSS_V30_METRICS.temporal, setTemporalMetrics)}
                {renderMetric('RC', CVSS_V30_METRICS.temporal, setTemporalMetrics)}
              </div>
            </div>

            {/* Column 3: Environmental Metrics */}
            <div className="cvss-column">
              <div className="cvss-group-container">
                <div className="cvss-group-header">Environmental Metrics</div>
                
                <div className="cvss-sub-group-header">Security Requirements</div>
                {renderMetric('CR', CVSS_V30_METRICS.environmental, setEnvironmentalMetrics)}
                {renderMetric('IR', CVSS_V30_METRICS.environmental, setEnvironmentalMetrics)}
                {renderMetric('AR', CVSS_V30_METRICS.environmental, setEnvironmentalMetrics)}

                <div className="cvss-sub-group-header">Modified Base Metrics</div>
                {renderMetric('MAV', CVSS_V30_METRICS.environmental, setEnvironmentalMetrics)}
                {renderMetric('MAC', CVSS_V30_METRICS.environmental, setEnvironmentalMetrics)}
                {renderMetric('MPR', CVSS_V30_METRICS.environmental, setEnvironmentalMetrics)}
                {renderMetric('MUI', CVSS_V30_METRICS.environmental, setEnvironmentalMetrics)}
                {renderMetric('MS', CVSS_V30_METRICS.environmental, setEnvironmentalMetrics)}
                {renderMetric('MC', CVSS_V30_METRICS.environmental, setEnvironmentalMetrics)}
                {renderMetric('MI', CVSS_V30_METRICS.environmental, setEnvironmentalMetrics)}
                {renderMetric('MA', CVSS_V30_METRICS.environmental, setEnvironmentalMetrics)}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Enregistrer le score
          </button>
        </div>
      </div>
    </div>
  );
}

export default CVSSv30Calculator;
