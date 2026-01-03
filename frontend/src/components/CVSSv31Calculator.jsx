import { useState, useEffect, useRef } from 'react';


// ==================== DÉFINITIONS DES MÉTRIQUES CVSS v3.1 ====================

// Metric group descriptions from FIRST.org
const METRIC_DESCRIPTIONS_V31 = {
  'Attack Vector': 'This metric reflects the context by which vulnerability exploitation is possible. This metric value (and consequently the Base score) will be larger the more remote (logically, and physically) an attacker can be in order to exploit the vulnerable component.',
  'Attack Complexity': 'This metric describes the conditions beyond the attacker\'s control that must exist in order to exploit the vulnerability. As described below, such conditions may require the collection of more information about the target, or computational exceptions.',
  'Privileges Required': 'This metric describes the level of privileges an attacker must possess before successfully exploiting the vulnerability. The Base Score increases as fewer privileges are required.',
  'User Interaction': 'This metric captures the requirement for a human user, other than the attacker, to participate in the successful compromise of the vulnerable component. This metric determines whether the vulnerability can be exploited solely at the will of the attacker, or whether a separate user (or user-initiated process) must participate in some manner.',
  'Scope': 'The Scope metric captures whether a vulnerability in one vulnerable component impacts resources in components beyond its security scope. Formally, a security authority is a mechanism that defines and enforces access control in terms of how certain subjects/actors can access certain restricted objects/resources in a given system.',
  'Confidentiality': 'This metric measures the impact to the confidentiality of the information resources managed by a software component due to a successfully exploited vulnerability. Confidentiality refers to limiting information access and disclosure to only authorized users, as well as preventing access by, or disclosure to, unauthorized ones.',
  'Confidentiality Impact': 'This metric measures the impact to the confidentiality of the information resources managed by a software component due to a successfully exploited vulnerability. Confidentiality refers to limiting information access and disclosure to only authorized users, as well as preventing access by, or disclosure to, unauthorized ones.',
  'Integrity': 'This metric measures the impact to integrity of a successfully exploited vulnerability. Integrity refers to the trustworthiness and veracity of information. The Base Score increases as the consequence to the impacted component increases.',
  'Integrity Impact': 'This metric measures the impact to integrity of a successfully exploited vulnerability. Integrity refers to the trustworthiness and veracity of information. The Base Score increases as the consequence to the impacted component increases.',
  'Availability': 'This metric measures the impact to the availability of the impacted component resulting from a successfully exploited vulnerability. While the Confidentiality and Integrity impact metrics apply to the loss of confidentiality or integrity of data used by the component, this metric refers to the loss of availability of the component itself.',
  'Availability Impact': 'This metric measures the impact to the availability of the impacted component resulting from a successfully exploited vulnerability. While the Confidentiality and Integrity impact metrics apply to the loss of confidentiality or integrity of data used by the component, this metric refers to the loss of availability of the component itself.',
  'Exploit Code Maturity': 'This metric measures the likelihood of the vulnerability being attacked, and is typically based on the current state of exploit techniques, exploit code availability, or active, "in-the-wild" exploitation.',
  'Remediation Level': 'The Remediation Level of a vulnerability is an important factor for prioritization. The typical vulnerability is unpatched when initially published. Workarounds or hotfixes may offer interim remediation until an official patch or upgrade is issued.',
  'Report Confidence': 'This metric measures the degree of confidence in the existence of the vulnerability and the credibility of the known technical details. Sometimes only the existence of vulnerabilities are publicized, but without specific details.',
  'Confidentiality Requirement': 'These metrics enable the analyst to customize the CVSS score depending on the importance of the affected IT asset to a user\'s organization, measured in terms of Confidentiality.',
  'Integrity Requirement': 'These metrics enable the analyst to customize the CVSS score depending on the importance of the affected IT asset to a user\'s organization, measured in terms of Integrity.',
  'Availability Requirement': 'These metrics enable the analyst to customize the CVSS score depending on the importance of the affected IT asset to a user\'s organization, measured in terms of Availability.',
  'Modified Attack Vector': 'These metrics enable the analyst to override individual Base metrics based on specific characteristics of a user\'s environment. This metric reflects the context by which vulnerability exploitation is possible in the analyst\'s environment.',
  'Modified Attack Complexity': 'This metric reflects the complexity of the attack in the analyst\'s environment.',
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

const CVSS_V31_METRICS = {
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
          desc: 'The vulnerable component is bound to the network stack and the set of possible attackers extends beyond the other options listed, up to and including the entire Internet. Such a vulnerability is often termed "remotely exploitable" and can be thought of as an attack being exploitable at the protocol level one or more network hops away (e.g., across one or more routers).'
        },
        { 
          value: 'A', 
          label: 'Adjacent', 
          metric: 0.62,
          desc: 'The vulnerable component is bound to the network stack, but the attack is limited at the protocol level to a logically adjacent topology. This can mean an attack must be launched from the same shared physical (e.g., Bluetooth or IEEE 802.11) or logical (e.g., local IP subnet) network, or from within a secure or otherwise limited administrative domain (e.g., MPLS, secure VPN).'
        },
        { 
          value: 'L', 
          label: 'Local', 
          metric: 0.55,
          desc: 'The vulnerable component is not bound to the network stack and the attacker\'s path is via read/write/execute capabilities. Either: the attacker exploits the vulnerability by accessing the target system locally (e.g., keyboard, console), or remotely (e.g., SSH); or the attacker relies on User Interaction by another person to perform actions required to exploit the vulnerability.'
        },
        { 
          value: 'P', 
          label: 'Physical', 
          metric: 0.2,
          desc: 'The attack requires the attacker to physically touch or manipulate the vulnerable component. Physical interaction may be brief (e.g., evil maid attack) or persistent. An example of such an attack is a cold boot attack in which an attacker gains access to disk encryption keys after physically accessing the target system.'
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
          desc: 'Specialized access conditions or extenuating circumstances do not exist. An attacker can expect repeatable success when attacking the vulnerable component.'
        },
        { 
          value: 'H', 
          label: 'High', 
          metric: 0.44,
          desc: 'A successful attack depends on conditions beyond the attacker\'s control. That is, a successful attack cannot be accomplished at will, but requires the attacker to invest in some measurable amount of effort in preparation or execution against the vulnerable component before a successful attack can be expected.'
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
          desc: 'The attacker is unauthorized prior to attack, and therefore does not require any access to settings or files of the vulnerable system to carry out an attack.'
        },
        { 
          value: 'L', 
          label: 'Low', 
          metricUnchanged: 0.62,
          metricChanged: 0.68,
          desc: 'The attacker requires privileges that provide basic user capabilities that could normally affect only settings and files owned by a user. Alternatively, an attacker with Low privileges has the ability to access only non-sensitive resources.'
        },
        { 
          value: 'H', 
          label: 'High', 
          metricUnchanged: 0.27,
          metricChanged: 0.5,
          desc: 'The attacker requires privileges that provide significant (e.g., administrative) control over the vulnerable component allowing access to component-wide settings and files.'
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
      category: 'Scope',
      options: [
        { 
          value: 'U', 
          label: 'Unchanged',
          desc: 'An exploited vulnerability can only affect resources managed by the same security authority. In this case, the vulnerable component and the impacted component are either the same, or both are managed by the same security authority.'
        },
        { 
          value: 'C', 
          label: 'Changed',
          desc: 'An exploited vulnerability can affect resources beyond the security scope managed by the security authority of the vulnerable component. In this case, the vulnerable component and the impacted component are different and managed by different security authorities.'
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
          desc: 'There is a total loss of confidentiality, resulting in all resources within the impacted component being divulged to the attacker. Alternatively, access to only some restricted information is obtained, but the disclosed information presents a direct, serious impact. For example, an attacker steals the administrator\'s password, or private encryption keys of a web server.'
        },
        { 
          value: 'L', 
          label: 'Low', 
          metric: 0.22,
          desc: 'There is some loss of confidentiality. Access to some restricted information is obtained, but the attacker does not have control over what information is obtained, or the amount or kind of loss is limited. The information disclosure does not cause a direct, serious loss to the impacted component.'
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
          desc: 'Modification of data is possible, but the attacker does not have control over the consequence of a modification, or the amount of modification is limited. The data modification does not have a direct, serious impact on the impacted component.'
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
          desc: 'There is a total loss of availability, resulting in the attacker being able to fully deny access to resources in the impacted component; this loss is either sustained (while the attacker continues to deliver the attack) or persistent (the condition persists even after the attack has completed). Alternatively, the attacker has the ability to deny some availability, but the loss of availability presents a direct, serious consequence to the impacted component.'
        },
        { 
          value: 'L', 
          label: 'Low', 
          metric: 0.22,
          desc: 'Performance is reduced or there are interruptions in resource availability. Even if repeated exploitation of the vulnerability is possible, the attacker does not have the ability to completely deny service to legitimate users. The resources in the impacted component are either partially available all of the time, or fully available only some of the time, but overall there is no direct, serious consequence to the impacted component.'
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

  // TEMPORAL SCORE METRICS
  temporal: {
    E: {
      name: 'Exploit Code Maturity',
      short: 'E',
      options: [
        { value: 'X', label: 'Not Defined', metric: 1.0, desc: 'Assigning this value indicates there is insufficient information to choose one of the other values, and has no impact on the overall Temporal Score, i.e., it has the same effect on scoring as assigning High.' },
        { value: 'H', label: 'High', metric: 1.0, desc: 'Functional autonomous code exists, or no exploit is required (manual trigger) and details are widely available. Exploit code works in every situation, or is actively being delivered via an autonomous agent (such as a worm or virus). Network-connected systems are likely to encounter scanning or exploitation attempts.' },
        { value: 'F', label: 'Functional', metric: 0.97, desc: 'Functional exploit code is available. The code works in most situations where the vulnerability exists.' },
        { value: 'P', label: 'Proof-of-Concept', metric: 0.94, desc: 'Proof-of-concept exploit code is available, or an attack demonstration is not practical for most systems. The code or technique is not functional in all situations and may require substantial modification by a skilled attacker.' },
        { value: 'U', label: 'Unproven', metric: 0.91, desc: 'No exploit code is available, or an exploit is theoretical.' }
      ]
    },
    RL: {
      name: 'Remediation Level',
      short: 'RL',
      options: [
        { value: 'X', label: 'Not Defined', metric: 1.0, desc: 'Assigning this value indicates there is insufficient information to choose one of the other values, and has no impact on the overall Temporal Score, i.e., it has the same effect on scoring as assigning Unavailable.' },
        { value: 'U', label: 'Unavailable', metric: 1.0, desc: 'There is either no solution available or it is impossible to apply.' },
        { value: 'W', label: 'Workaround', metric: 0.97, desc: 'There is an unofficial, non-vendor solution available. In some cases, users of the affected technology will create a patch of their own or provide steps to work around or otherwise mitigate the vulnerability.' },
        { value: 'T', label: 'Temporary Fix', metric: 0.96, desc: 'There is an official but temporary fix available. This includes instances where the vendor issues a temporary hotfix, tool, or workaround.' },
        { value: 'O', label: 'Official Fix', metric: 0.95, desc: 'A complete vendor solution is available. Either the vendor has issued an official patch, or an upgrade is available.' }
      ]
    },
    RC: {
      name: 'Report Confidence',
      short: 'RC',
      options: [
        { value: 'X', label: 'Not Defined', metric: 1.0, desc: 'Assigning this value indicates there is insufficient information to choose one of the other values, and has no impact on the overall Temporal Score, i.e., it has the same effect on scoring as assigning Confirmed.' },
        { value: 'C', label: 'Confirmed', metric: 1.0, desc: 'Detailed reports exist, or functional reproduction is possible (functional exploits may provide this). Source code is available to independently verify the assertions of the research, or the author or vendor of the affected code has confirmed the presence of the vulnerability.' },
        { value: 'R', label: 'Reasonable', metric: 0.96, desc: 'Significant details are published, but researchers either do not have full confidence in the root cause, or do not have access to source code to fully confirm all of the interactions that may lead to the result. Reasonable confidence exists, however, that the bug is reproducible and at least one impact is able to be verified (proof-of-concept exploits may provide this).' },
        { value: 'U', label: 'Unknown', metric: 0.92, desc: 'There are reports of impacts that indicate a vulnerability is present. The reports indicate that the cause of the vulnerability is unknown, or reports may differ on the cause or impacts of the vulnerability. Reporters are uncertain of the true nature of the vulnerability, and there is little confidence in the validity of the reports.' }
      ]
    }
  },

  // ENVIRONMENTAL SCORE METRICS
  environmental: {
    CR: {
      name: 'Confidentiality Requirement',
      short: 'CR',
      options: [
        { value: 'X', label: 'Not Defined', metric: 1.0, desc: 'Assigning this value indicates there is insufficient information to choose one of the other values.' },
        { value: 'H', label: 'High', metric: 1.5, desc: 'Loss of Confidentiality is likely to have a catastrophic adverse effect.' },
        { value: 'M', label: 'Medium', metric: 1.0, desc: 'Loss of Confidentiality is likely to have a serious adverse effect.' },
        { value: 'L', label: 'Low', metric: 0.5, desc: 'Loss of Confidentiality is likely to have only a limited adverse effect.' }
      ]
    },
    IR: {
      name: 'Integrity Requirement',
      short: 'IR',
      options: [
        { value: 'X', label: 'Not Defined', metric: 1.0, desc: 'Assigning this value indicates there is insufficient information to choose one of the other values.' },
        { value: 'H', label: 'High', metric: 1.5, desc: 'Loss of Integrity is likely to have a catastrophic adverse effect.' },
        { value: 'M', label: 'Medium', metric: 1.0, desc: 'Loss of Integrity is likely to have a serious adverse effect.' },
        { value: 'L', label: 'Low', metric: 0.5, desc: 'Loss of Integrity is likely to have only a limited adverse effect.' }
      ]
    },
    AR: {
      name: 'Availability Requirement',
      short: 'AR',
      options: [
        { value: 'X', label: 'Not Defined', metric: 1.0, desc: 'Assigning this value indicates there is insufficient information to choose one of the other values.' },
        { value: 'H', label: 'High', metric: 1.5, desc: 'Loss of Availability is likely to have a catastrophic adverse effect.' },
        { value: 'M', label: 'Medium', metric: 1.0, desc: 'Loss of Availability is likely to have a serious adverse effect.' },
        { value: 'L', label: 'Low', metric: 0.5, desc: 'Loss of Availability is likely to have only a limited adverse effect.' }
      ]
    },
    // Modified Base Metrics
    MAV: {
      name: 'Modified Attack Vector',
      short: 'MAV',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'Use the value from Base Score.' },
        { value: 'N', label: 'Network', metric: 0.85 },
        { value: 'A', label: 'Adjacent', metric: 0.62 },
        { value: 'L', label: 'Local', metric: 0.55 },
        { value: 'P', label: 'Physical', metric: 0.2 }
      ]
    },
    MAC: {
      name: 'Modified Attack Complexity',
      short: 'MAC',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'Use the value from Base Score.' },
        { value: 'L', label: 'Low', metric: 0.77 },
        { value: 'H', label: 'High', metric: 0.44 }
      ]
    },
    MPR: {
      name: 'Modified Privileges Required',
      short: 'MPR',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'Use the value from Base Score.' },
        { value: 'N', label: 'None', metricUnchanged: 0.85, metricChanged: 0.85 },
        { value: 'L', label: 'Low', metricUnchanged: 0.62, metricChanged: 0.68 },
        { value: 'H', label: 'High', metricUnchanged: 0.27, metricChanged: 0.5 }
      ]
    },
    MUI: {
      name: 'Modified User Interaction',
      short: 'MUI',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'Use the value from Base Score.' },
        { value: 'N', label: 'None', metric: 0.85 },
        { value: 'R', label: 'Required', metric: 0.62 }
      ]
    },
    MS: {
      name: 'Modified Scope',
      short: 'MS',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'Use the value from Base Score.' },
        { value: 'U', label: 'Unchanged' },
        { value: 'C', label: 'Changed' }
      ]
    },
    MC: {
      name: 'Modified Confidentiality',
      short: 'MC',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'Use the value from Base Score.' },
        { value: 'H', label: 'High', metric: 0.56 },
        { value: 'L', label: 'Low', metric: 0.22 },
        { value: 'N', label: 'None', metric: 0 }
      ]
    },
    MI: {
      name: 'Modified Integrity',
      short: 'MI',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'Use the value from Base Score.' },
        { value: 'H', label: 'High', metric: 0.56 },
        { value: 'L', label: 'Low', metric: 0.22 },
        { value: 'N', label: 'None', metric: 0 }
      ]
    },
    MA: {
      name: 'Modified Availability',
      short: 'MA',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'Use the value from Base Score.' },
        { value: 'H', label: 'High', metric: 0.56 },
        { value: 'L', label: 'Low', metric: 0.22 },
        { value: 'N', label: 'None', metric: 0 }
      ]
    }
  }
};

function CVSSv31Calculator({ vulnerability, onSave, onClose }) {
  // Base metrics
  const [baseMetrics, setBaseMetrics] = useState({
    AV: null, AC: null, PR: null, UI: null, S: null, C: null, I: null, A: null
  });

  // Temporal metrics
  const [temporalMetrics, setTemporalMetrics] = useState({
    E: 'X', RL: 'X', RC: 'X'
  });

  // Environmental metrics
  const [environmentalMetrics, setEnvironmentalMetrics] = useState({
    CR: 'X', IR: 'X', AR: 'X',
    MAV: 'X', MAC: 'X', MPR: 'X', MUI: 'X', MS: 'X', MC: 'X', MI: 'X', MA: 'X'
  });

  const [scores, setScores] = useState({
    base: 0,
    temporal: 0,
    environmental: 0
  });

  const [severities, setSeverities] = useState({
    base: 'NONE',
    temporal: 'NONE',
    environmental: 'NONE'
  });

  // Refs for score animation
  const baseScoreRef = useRef(null);
  const temporalScoreRef = useRef(null);
  const environmentalScoreRef = useRef(null);

  useEffect(() => {
    // Utiliser le vecteur modifié en priorité, sinon le vecteur original
    const vector = vulnerability.modifiedVector || vulnerability.vectorString || vulnerability.vecteur;
    if (vector) {
      parseVector(vector);
    }
  }, []);

  useEffect(() => {
    calculateScores();
  }, [baseMetrics, temporalMetrics, environmentalMetrics]);

  const parseVector = (vectorString) => {
    if (!vectorString) return;
    const parts = vectorString.split('/');
    const newBase = {};
    const newTemporal = {};
    const newEnv = {};
    
    parts.forEach(part => {
      const [key, value] = part.split(':');
      if (CVSS_V31_METRICS.base[key]) {
        newBase[key] = value;
      } else if (CVSS_V31_METRICS.temporal[key]) {
        newTemporal[key] = value;
      } else if (CVSS_V31_METRICS.environmental[key]) {
        newEnv[key] = value;
      }
    });
    
    setBaseMetrics(prev => ({ ...prev, ...newBase }));
    setTemporalMetrics(prev => ({ ...prev, ...newTemporal }));
    setEnvironmentalMetrics(prev => ({ ...prev, ...newEnv }));
  };

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

  const getMetricValue = (metricKey, isModified = false) => {
    const baseMetric = CVSS_V31_METRICS.base[metricKey];
    const selectedValue = baseMetrics[metricKey];
    
    if (!selectedValue) return 0;
    
    const option = baseMetric.options.find(opt => opt.value === selectedValue);
    if (!option) return 0;

    if (metricKey === 'PR') {
      return baseMetrics.S === 'C' ? option.metricChanged : option.metricUnchanged;
    }
    
    return option.metric || 0;
  };

  const getTemporalMetricValue = (metricKey) => {
    const metric = CVSS_V31_METRICS.temporal[metricKey];
    const value = temporalMetrics[metricKey];
    const option = metric.options.find(opt => opt.value === value);
    return option ? option.metric : 1.0;
  };

  const getEnvironmentalMetricValue = (metricKey) => {
    const metric = CVSS_V31_METRICS.environmental[metricKey];
    const value = environmentalMetrics[metricKey];
    
    if (value === 'X') {
      // Use base metric value
      const baseKey = metricKey.replace('M', '');
      if (CVSS_V31_METRICS.base[baseKey]) {
        return getMetricValue(baseKey);
      }
      return 1.0;
    }
    
    const option = metric.options.find(opt => opt.value === value);
    if (!option) return 1.0;
    
    if (metricKey === 'MPR') {
      const scope = environmentalMetrics.MS === 'X' ? baseMetrics.S : environmentalMetrics.MS;
      return scope === 'C' ? option.metricChanged : option.metricUnchanged;
    }
    
    return option.metric || 1.0;
  };

  // Animate score value when it changes
  const animateScoreChange = (ref) => {
    if (ref.current) {
      ref.current.classList.add('updating');
      setTimeout(() => {
        ref.current?.classList.remove('updating');
      }, 300);
    }
  };

  const calculateScores = () => {
    // Check if all base metrics are selected
    if (Object.values(baseMetrics).some(v => v === null)) {
      setScores({ base: 0, temporal: 0, environmental: 0 });
      setSeverities({ base: 'NONE', temporal: 'NONE', environmental: 'NONE' });
      return;
    }

    // === BASE SCORE ===
    const exploitability = 8.22 * 
      getMetricValue('AV') * 
      getMetricValue('AC') * 
      getMetricValue('PR') * 
      getMetricValue('UI');

    const impactBase = 1 - (
      (1 - getMetricValue('C')) *
      (1 - getMetricValue('I')) *
      (1 - getMetricValue('A'))
    );

    let impact;
    if (baseMetrics.S === 'U') {
      impact = 6.42 * impactBase;
    } else {
      impact = 7.52 * (impactBase - 0.029) - 3.25 * Math.pow(impactBase - 0.02, 15);
    }

    let baseScore;
    if (impact <= 0) {
      baseScore = 0;
    } else {
      if (baseMetrics.S === 'U') {
        baseScore = Math.min(impact + exploitability, 10);
      } else {
        baseScore = Math.min(1.08 * (impact + exploitability), 10);
      }
    }
    baseScore = roundUp(baseScore);

    // === TEMPORAL SCORE ===
    const temporalScore = roundUp(
      baseScore *
      getTemporalMetricValue('E') *
      getTemporalMetricValue('RL') *
      getTemporalMetricValue('RC')
    );

    // === ENVIRONMENTAL SCORE ===
    const modifiedExploitability = 8.22 *
      getEnvironmentalMetricValue('MAV') *
      getEnvironmentalMetricValue('MAC') *
      getEnvironmentalMetricValue('MPR') *
      getEnvironmentalMetricValue('MUI');

    const modifiedImpactBase = Math.min(
      1 - (
        (1 - getEnvironmentalMetricValue('MC') * getEnvironmentalMetricValue('CR')) *
        (1 - getEnvironmentalMetricValue('MI') * getEnvironmentalMetricValue('IR')) *
        (1 - getEnvironmentalMetricValue('MA') * getEnvironmentalMetricValue('AR'))
      ),
      0.915
    );

    const modifiedScope = environmentalMetrics.MS === 'X' ? baseMetrics.S : environmentalMetrics.MS;

    let modifiedImpact;
    if (modifiedScope === 'U') {
      modifiedImpact = 6.42 * modifiedImpactBase;
    } else {
      modifiedImpact = 7.52 * (modifiedImpactBase - 0.029) - 3.25 * Math.pow(modifiedImpactBase - 0.02, 15);
    }

    let environmentalScore;
    if (modifiedImpact <= 0) {
      environmentalScore = 0;
    } else {
      if (modifiedScope === 'U') {
        environmentalScore = roundUp(
          roundUp(Math.min(modifiedImpact + modifiedExploitability, 10)) *
          getTemporalMetricValue('E') *
          getTemporalMetricValue('RL') *
          getTemporalMetricValue('RC')
        );
      } else {
        environmentalScore = roundUp(
          roundUp(Math.min(1.08 * (modifiedImpact + modifiedExploitability), 10)) *
          getTemporalMetricValue('E') *
          getTemporalMetricValue('RL') *
          getTemporalMetricValue('RC')
        );
      }
    }

    // Animate score changes
    animateScoreChange(baseScoreRef);
    animateScoreChange(temporalScoreRef);
    animateScoreChange(environmentalScoreRef);

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

  const generateVector = () => {
    let vector = `CVSS:3.1/AV:${baseMetrics.AV}/AC:${baseMetrics.AC}/PR:${baseMetrics.PR}/UI:${baseMetrics.UI}/S:${baseMetrics.S}/C:${baseMetrics.C}/I:${baseMetrics.I}/A:${baseMetrics.A}`;
    
    // Add temporal metrics if not default
    if (temporalMetrics.E !== 'X') vector += `/E:${temporalMetrics.E}`;
    if (temporalMetrics.RL !== 'X') vector += `/RL:${temporalMetrics.RL}`;
    if (temporalMetrics.RC !== 'X') vector += `/RC:${temporalMetrics.RC}`;
    
    // Add environmental metrics if not default
    if (environmentalMetrics.CR !== 'X') vector += `/CR:${environmentalMetrics.CR}`;
    if (environmentalMetrics.IR !== 'X') vector += `/IR:${environmentalMetrics.IR}`;
    if (environmentalMetrics.AR !== 'X') vector += `/AR:${environmentalMetrics.AR}`;
    if (environmentalMetrics.MAV !== 'X') vector += `/MAV:${environmentalMetrics.MAV}`;
    if (environmentalMetrics.MAC !== 'X') vector += `/MAC:${environmentalMetrics.MAC}`;
    if (environmentalMetrics.MPR !== 'X') vector += `/MPR:${environmentalMetrics.MPR}`;
    if (environmentalMetrics.MUI !== 'X') vector += `/MUI:${environmentalMetrics.MUI}`;
    if (environmentalMetrics.MS !== 'X') vector += `/MS:${environmentalMetrics.MS}`;
    if (environmentalMetrics.MC !== 'X') vector += `/MC:${environmentalMetrics.MC}`;
    if (environmentalMetrics.MI !== 'X') vector += `/MI:${environmentalMetrics.MI}`;
    if (environmentalMetrics.MA !== 'X') vector += `/MA:${environmentalMetrics.MA}`;
    
    return vector;
  };

  const handleSave = () => {
    if (Object.values(baseMetrics).some(v => v === null)) {
      alert('⚠️ Veuillez sélectionner toutes les métriques de base');
      return;
    }
    
    // Use environmental score if set, otherwise temporal, otherwise base
    const finalScore = scores.environmental > 0 ? scores.environmental :
                      scores.temporal > 0 ? scores.temporal :
                      scores.base;
    
    const finalSeverity = scores.environmental > 0 ? severities.environmental :
                         scores.temporal > 0 ? severities.temporal :
                         severities.base;
    
    onSave({
      score: finalScore,
      vector: generateVector(),
      severity: finalSeverity
    });
  };

  const getSeverityColor = (sev) => {
    const colors = {
      'CRITICAL': '#dc2626',
      'HIGH': '#f97316',
      'MEDIUM': '#eab308',
      'LOW': '#84cc16',
      'NONE': '#64748b'
    };
    return colors[sev] || '#64748b';
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

  const renderMetric = (metricKey, metricGroup, setState) => {
    const metric = metricGroup[metricKey];
    const state = setState === setBaseMetrics ? baseMetrics :
                 setState === setTemporalMetrics ? temporalMetrics :
                 environmentalMetrics;
    const selected = state[metricKey];
    const metricDescription = METRIC_DESCRIPTIONS_V31[metric.name];

    return (
      <div key={metricKey} className="cvss-metric-group">
        <div className="cvss-metric-header">
          <MetricTooltip text={metricDescription}>
            <label className="cvss-metric-label">
              {metric.name} <span className="metric-short">({metric.short})</span>
            </label>
          </MetricTooltip>
        </div>
        <div className="cvss-metric-options">
          {metric.options.map(option => (
            <button
              key={option.value}
              className={`cvss-option ${selected === option.value ? 'active' : ''}`}
              onClick={() => setState(prev => ({ ...prev, [metricKey]: option.value }))}
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
              <h2>🧮 Calculateur CVSS v3.1</h2>
              <p className="modal-subtitle">
                Common Vulnerability Scoring System Version 3.1 Calculator
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
                {renderMetric('AV', CVSS_V31_METRICS.base, setBaseMetrics)}
                {renderMetric('AC', CVSS_V31_METRICS.base, setBaseMetrics)}
                {renderMetric('PR', CVSS_V31_METRICS.base, setBaseMetrics)}
                {renderMetric('UI', CVSS_V31_METRICS.base, setBaseMetrics)}
                
                <div className="cvss-sub-group-header">Scope</div>
                {renderMetric('S', CVSS_V31_METRICS.base, setBaseMetrics)}
                
                <div className="cvss-sub-group-header">Impact</div>
                {renderMetric('C', CVSS_V31_METRICS.base, setBaseMetrics)}
                {renderMetric('I', CVSS_V31_METRICS.base, setBaseMetrics)}
                {renderMetric('A', CVSS_V31_METRICS.base, setBaseMetrics)}
              </div>
            </div>

            {/* Column 2: Temporal & Env Requirements */}
            <div className="cvss-column">
              <div className="cvss-group-container">
                <div className="cvss-group-header">Temporal Metrics</div>
                {renderMetric('E', CVSS_V31_METRICS.temporal, setTemporalMetrics)}
                {renderMetric('RL', CVSS_V31_METRICS.temporal, setTemporalMetrics)}
                {renderMetric('RC', CVSS_V31_METRICS.temporal, setTemporalMetrics)}
              </div>

              <div className="cvss-group-container">
                <div className="cvss-group-header">Environmental Req.</div>
                {renderMetric('CR', CVSS_V31_METRICS.environmental, setEnvironmentalMetrics)}
                {renderMetric('IR', CVSS_V31_METRICS.environmental, setEnvironmentalMetrics)}
                {renderMetric('AR', CVSS_V31_METRICS.environmental, setEnvironmentalMetrics)}
              </div>
            </div>

            {/* Column 3: Env Modified Base */}
            <div className="cvss-column">
              <div className="cvss-group-container">
                <div className="cvss-group-header">Modified Base Metrics</div>
                <div className="grid grid-cols-2 gap-x-4">
                  <div>
                    {renderMetric('MAV', CVSS_V31_METRICS.environmental, setEnvironmentalMetrics)}
                    {renderMetric('MAC', CVSS_V31_METRICS.environmental, setEnvironmentalMetrics)}
                    {renderMetric('MPR', CVSS_V31_METRICS.environmental, setEnvironmentalMetrics)}
                    {renderMetric('MUI', CVSS_V31_METRICS.environmental, setEnvironmentalMetrics)}
                  </div>
                  <div>
                    {renderMetric('MS', CVSS_V31_METRICS.environmental, setEnvironmentalMetrics)}
                    {renderMetric('MC', CVSS_V31_METRICS.environmental, setEnvironmentalMetrics)}
                    {renderMetric('MI', CVSS_V31_METRICS.environmental, setEnvironmentalMetrics)}
                    {renderMetric('MA', CVSS_V31_METRICS.environmental, setEnvironmentalMetrics)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={Object.values(baseMetrics).some(v => v === null)}
          >
            💾 Enregistrer le score
          </button>
        </div>
      </div>
    </div>
  );
}

export default CVSSv31Calculator;