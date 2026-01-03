import { useState, useEffect, useRef } from 'react';
import { calculateCVSS40Score, generateCVSS40Vector, getCVSS40Severity, getMacroVector } from '../services/cvss40Service';
import logger from '../utils/logger';


// ==================== CVSS v4.0 METRICS DEFINITIONS ====================

// Metric group descriptions from FIRST.org
const METRIC_DESCRIPTIONS = {
  'Attack Vector': 'This metric reflects the context by which vulnerability exploitation is possible. This metric value (and consequently the resulting severity) will be larger the more remote (logically, and physically) an attacker can be in order to exploit the vulnerable system.',
  'Attack Complexity': 'This metric captures measurable actions that must be taken by the attacker to actively evade or circumvent existing built-in security-enhancing conditions in order to obtain a working exploit.',
  'Attack Requirements': 'This metric captures the prerequisite deployment and execution conditions or variables of the vulnerable system that enable the attack.',
  'Privileges Required': 'This metric describes the level of privileges an attacker must possess prior to successfully exploiting the vulnerability.',
  'User Interaction': 'This metric captures the requirement for a human user, other than the attacker, to participate in the successful compromise of the vulnerable system.',
  'Vulnerable System Confidentiality': 'This metric measures the impact to the confidentiality of the information managed by the system due to a successfully exploited vulnerability.',
  'Vulnerable System Integrity': 'This metric measures the impact to integrity of a successfully exploited vulnerability. Integrity refers to the trustworthiness and veracity of information.',
  'Vulnerable System Availability': 'This metric measures the impact to the availability of the impacted system resulting from a successfully exploited vulnerability.',
  'Subsequent System Confidentiality': 'This metric measures the impact to the confidentiality of the information managed by the Subsequent System due to a successfully exploited vulnerability.',
  'Subsequent System Integrity': 'This metric measures the impact to integrity of a successfully exploited vulnerability in the Subsequent System.',
  'Subsequent System Availability': 'This metric measures the impact to the availability of the Subsequent System resulting from a successfully exploited vulnerability.',
  'Exploit Maturity': 'This metric measures the likelihood of the vulnerability being attacked, and is based on the current state of exploit techniques, exploit code availability, or active, "in-the-wild" exploitation.',
  'Confidentiality Requirement': 'These metrics enable the consumer to customize the assessment depending on the importance of the affected IT asset to the analyst\'s organization, measured in terms of Confidentiality.',
  'Integrity Requirement': 'These metrics enable the consumer to customize the assessment depending on the importance of the affected IT asset to the analyst\'s organization, measured in terms of Integrity.',
  'Availability Requirement': 'These metrics enable the consumer to customize the assessment depending on the importance of the affected IT asset to the analyst\'s organization, measured in terms of Availability.',
  'Modified Attack Vector': 'This metric enables the consumer analyst to override the Base Attack Vector metric value based on specific characteristics of the user\'s environment.',
  'Modified Attack Complexity': 'This metric enables the consumer analyst to override the Base Attack Complexity metric value based on specific characteristics of the user\'s environment.',
  'Modified Attack Requirements': 'This metric enables the consumer analyst to override the Base Attack Requirements metric value based on specific characteristics of the user\'s environment.',
  'Modified Privileges Required': 'This metric enables the consumer analyst to override the Base Privileges Required metric value based on specific characteristics of the user\'s environment.',
  'Modified User Interaction': 'This metric enables the consumer analyst to override the Base User Interaction metric value based on specific characteristics of the user\'s environment.',
  'Modified Vulnerable System Confidentiality': 'This metric enables the consumer analyst to override the Base Vulnerable System Confidentiality metric value based on specific characteristics of the user\'s environment.',
  'Modified Vulnerable System Integrity': 'This metric enables the consumer analyst to override the Base Vulnerable System Integrity metric value based on specific characteristics of the user\'s environment.',
  'Modified Vulnerable System Availability': 'This metric enables the consumer analyst to override the Base Vulnerable System Availability metric value based on specific characteristics of the user\'s environment.',
  'Modified Subsequent System Confidentiality': 'This metric enables the consumer analyst to override the Base Subsequent System Confidentiality metric value based on specific characteristics of the user\'s environment.',
  'Modified Subsequent System Integrity': 'This metric enables the consumer analyst to override the Base Subsequent System Integrity metric value based on specific characteristics of the user\'s environment.',
  'Modified Subsequent System Availability': 'This metric enables the consumer analyst to override the Base Subsequent System Availability metric value based on specific characteristics of the user\'s environment.',
  'Safety': 'When a system does have an intended use or fitness of purpose aligned to safety, it is possible that exploiting a vulnerability within that system may have Safety impact.',
  'Automatable': 'The "Automatable" metric captures the answer to the question "Can an attacker automate exploitation events for this vulnerability across multiple targets?" based on steps 1-4 of the kill chain.',
  'Recovery': 'Recovery describes the resilience of a system to recover services, in terms of performance and availability, after an attack has been performed.',
  'Value Density': 'Value Density describes the resources that the attacker will gain control over with a single exploitation event.',
  'Vulnerability Response Effort': 'The intention of the Vulnerability Response Effort metric is to provide supplemental information on how difficult it is for consumers to provide an initial response to the impact of vulnerabilities.',
  'Provider Urgency': 'To facilitate a standardized method to incorporate additional provider-supplied assessment, an optional "pass-through" Supplemental Metric called Provider Urgency is available.'
};

const CVSS_V4_METRICS = {
  // BASE METRICS
  base: {
    AV: {
      name: 'Attack Vector',
      short: 'AV',
      options: [
        { value: 'N', label: 'Network', desc: 'The vulnerable system is bound to the network stack and the set of possible attackers extends beyond the other options listed, up to and including the entire Internet. Such a vulnerability is often termed "remotely exploitable" and can be thought of as an attack being exploitable at the protocol level one or more network hops away (e.g., across one or more routers).' },
        { value: 'A', label: 'Adjacent', desc: 'The vulnerable system is bound to a protocol stack, but the attack is limited at the protocol level to a logically adjacent topology. This can mean an attack must be launched from the same shared proximity (e.g., Bluetooth, NFC, or IEEE 802.11) or logical network (e.g., local IP subnet), or from within a secure or otherwise limited administrative domain (e.g., MPLS, secure VPN).' },
        { value: 'L', label: 'Local', desc: 'The vulnerable system is not bound to the network stack and the attacker\'s path is via read/write/execute capabilities. Either: the attacker exploits the vulnerability by accessing the target system locally (e.g., keyboard, console), or through terminal emulation (e.g., SSH); or the attacker relies on User Interaction by another person to perform actions required to exploit the vulnerability.' },
        { value: 'P', label: 'Physical', desc: 'The attack requires the attacker to physically touch or manipulate the vulnerable system. Physical interaction may be brief (e.g., evil maid attack) or persistent. An example of such an attack is a cold boot attack in which an attacker gains access to disk encryption keys after physically accessing the target system.' }
      ]
    },
    AC: {
      name: 'Attack Complexity',
      short: 'AC',
      options: [
        { value: 'L', label: 'Low', desc: 'The attacker must take no measurable action to exploit the vulnerability. The attack requires no target-specific circumvention to exploit the vulnerability. An attacker can expect repeatable success against the vulnerable system.' },
        { value: 'H', label: 'High', desc: 'The successful attack depends on the evasion or circumvention of security-enhancing techniques in place that would otherwise hinder the attack. These include: Evasion of exploit mitigation techniques, obtaining target-specific secrets, or the attacker must gather knowledge about the environment in which the vulnerable target/component exists.' }
      ]
    },
    AT: {
      name: 'Attack Requirements',
      short: 'AT',
      options: [
        { value: 'N', label: 'None', desc: 'The successful attack does not depend on the deployment and execution conditions of the vulnerable system. The attacker can expect to be able to reach the vulnerability and execute the exploit under all or most instances of the vulnerability.' },
        { value: 'P', label: 'Present', desc: 'The successful attack depends on the presence of specific deployment and execution conditions of the vulnerable system that enable the attack. These include: a race condition must be won, the attack may need to be launched multiple times, or network injection is required.' }
      ]
    },
    PR: {
      name: 'Privileges Required',
      short: 'PR',
      options: [
        { value: 'N', label: 'None', desc: 'The attacker is unauthenticated prior to attack, and therefore does not require any access to settings or files of the vulnerable system to carry out an attack.' },
        { value: 'L', label: 'Low', desc: 'The attacker requires privileges that provide basic capabilities that are typically limited to settings and resources owned by a single low-privileged user. Alternatively, an attacker with Low privileges has the ability to access only non-sensitive resources.' },
        { value: 'H', label: 'High', desc: 'The attacker requires privileges that provide significant (e.g., administrative) control over the vulnerable system allowing full access to the vulnerable system\'s settings and files.' }
      ]
    },
    UI: {
      name: 'User Interaction',
      short: 'UI',
      options: [
        { value: 'N', label: 'None', desc: 'The vulnerable system can be exploited without interaction from any human user, other than the attacker. Examples include: a remote attacker is able to send packets to a target system, or a locally authenticated attacker executes code to elevate privileges.' },
        { value: 'P', label: 'Passive', desc: 'Successful exploitation of this vulnerability requires limited interaction by the targeted user with the vulnerable system and the attacker\'s payload. These interactions would be considered involuntary and do not require that the user actively subvert protections built into the vulnerable system. Examples: utilizing a website that has been modified to display malicious content, running an application that calls a malicious binary.' },
        { value: 'A', label: 'Active', desc: 'Successful exploitation of this vulnerability requires a targeted user to perform specific, conscious interactions with the vulnerable system and the attacker\'s payload. Examples: importing a file into a vulnerable system, placing files into a specific directory, submitting a specific string into a web application, or dismissing security warnings prior to taking an action.' }
      ]
    },
    VC: {
      name: 'Vulnerable System Confidentiality',
      short: 'VC',
      options: [
        { value: 'H', label: 'High', desc: 'There is a total loss of confidentiality, resulting in all information within the Vulnerable System being divulged to the attacker. Alternatively, access to only some restricted information is obtained, but the disclosed information presents a direct, serious impact. For example, an attacker steals the administrator\'s password, or private encryption keys of a web server.' },
        { value: 'L', label: 'Low', desc: 'There is some loss of confidentiality. Access to some restricted information is obtained, but the attacker does not have control over what information is obtained, or the amount or kind of loss is limited. The information disclosure does not cause a direct, serious loss to the Vulnerable System.' },
        { value: 'N', label: 'None', desc: 'There is no loss of confidentiality within the Vulnerable System.' }
      ]
    },
    VI: {
      name: 'Vulnerable System Integrity',
      short: 'VI',
      options: [
        { value: 'H', label: 'High', desc: 'There is a total loss of integrity, or a complete loss of protection. For example, the attacker is able to modify any/all files protected by the Vulnerable System. Alternatively, only some files can be modified, but malicious modification would present a direct, serious consequence to the Vulnerable System.' },
        { value: 'L', label: 'Low', desc: 'Modification of data is possible, but the attacker does not have control over the consequence of a modification, or the amount of modification is limited. The data modification does not have a direct, serious impact to the Vulnerable System.' },
        { value: 'N', label: 'None', desc: 'There is no loss of integrity within the Vulnerable System.' }
      ]
    },
    VA: {
      name: 'Vulnerable System Availability',
      short: 'VA',
      options: [
        { value: 'H', label: 'High', desc: 'There is a total loss of availability, resulting in the attacker being able to fully deny access to resources in the Vulnerable System; this loss is either sustained (while the attacker continues to deliver the attack) or persistent (the condition persists even after the attack has completed). Alternatively, the attacker has the ability to deny some availability, but the loss of availability presents a direct, serious consequence to the Vulnerable System.' },
        { value: 'L', label: 'Low', desc: 'Performance is reduced or there are interruptions in resource availability. Even if repeated exploitation of the vulnerability is possible, the attacker does not have the ability to completely deny service to legitimate users. The resources in the Vulnerable System are either partially available all of the time, or fully available only some of the time, but overall there is no direct, serious consequence to the Vulnerable System.' },
        { value: 'N', label: 'None', desc: 'There is no impact to availability within the Vulnerable System.' }
      ]
    },
    SC: {
      name: 'Subsequent System Confidentiality',
      short: 'SC',
      options: [
        { value: 'H', label: 'High', desc: 'There is a total loss of confidentiality, resulting in all resources within the Subsequent System being divulged to the attacker. Alternatively, access to only some restricted information is obtained, but the disclosed information presents a direct, serious impact.' },
        { value: 'L', label: 'Low', desc: 'There is some loss of confidentiality. Access to some restricted information is obtained, but the attacker does not have control over what information is obtained, or the amount or kind of loss is limited. The information disclosure does not cause a direct, serious loss to the Subsequent System.' },
        { value: 'N', label: 'None', desc: 'There is no loss of confidentiality within the Subsequent System or all confidentiality impact is constrained to the Vulnerable System.' }
      ]
    },
    SI: {
      name: 'Subsequent System Integrity',
      short: 'SI',
      options: [
        { value: 'H', label: 'High', desc: 'There is a total loss of integrity, or a complete loss of protection. For example, the attacker is able to modify any/all files protected by the Subsequent System. Alternatively, only some files can be modified, but malicious modification would present a direct, serious consequence to the Subsequent System.' },
        { value: 'L', label: 'Low', desc: 'Modification of data is possible, but the attacker does not have control over the consequence of a modification, or the amount of modification is limited. The data modification does not have a direct, serious impact to the Subsequent System.' },
        { value: 'N', label: 'None', desc: 'There is no loss of integrity within the Subsequent System or all integrity impact is constrained to the Vulnerable System.' }
      ]
    },
    SA: {
      name: 'Subsequent System Availability',
      short: 'SA',
      options: [
        { value: 'H', label: 'High', desc: 'There is a total loss of availability, resulting in the attacker being able to fully deny access to resources in the Subsequent System; this loss is either sustained (while the attacker continues to deliver the attack) or persistent (the condition persists even after the attack has completed). Alternatively, the attacker has the ability to deny some availability, but the loss of availability presents a direct, serious consequence to the Subsequent System.' },
        { value: 'L', label: 'Low', desc: 'Performance is reduced or there are interruptions in resource availability. Even if repeated exploitation of the vulnerability is possible, the attacker does not have the ability to completely deny service to legitimate users. The resources in the Subsequent System are either partially available all of the time, or fully available only some of the time, but overall there is no direct, serious consequence to the Subsequent System.' },
        { value: 'N', label: 'None', desc: 'There is no impact to availability within the Subsequent System or all availability impact is constrained to the Vulnerable System.' }
      ]
    }
  },

  // THREAT METRICS
  threat: {
    E: {
      name: 'Exploit Maturity',
      short: 'E',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'The Exploit Maturity metric has not been evaluated. This is the default value and is equivalent to Attacked (A) for the purposes of the calculation of the score by assuming the worst case.' },
        { value: 'A', label: 'Attacked', desc: 'Based on available threat intelligence either of the following must apply: Attacks targeting this vulnerability (attempted or successful) have been reported, OR Solutions to simplify attempts to exploit the vulnerability are publicly or privately available (such as exploit toolkits).' },
        { value: 'P', label: 'POC', desc: 'Based on available threat intelligence each of the following must apply: Proof-of-concept exploit code is publicly available, No knowledge of reported attempts to exploit this vulnerability, No knowledge of publicly available solutions used to simplify attempts to exploit the vulnerability (i.e., the "Attacked" value does not apply).' },
        { value: 'U', label: 'Unreported', desc: 'Based on available threat intelligence each of the following must apply: No knowledge of publicly available proof-of-concept exploit code, No knowledge of reported attempts to exploit this vulnerability, No knowledge of publicly available solutions used to simplify attempts to exploit the vulnerability (i.e., neither the "POC" nor "Attacked" values apply).' }
      ]
    }
  },

  // ENVIRONMENTAL METRICS
  environmental: {
    CR: {
      name: 'Confidentiality Requirement',
      short: 'CR',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'Use default value' },
        { value: 'H', label: 'High', desc: 'High confidentiality requirement' },
        { value: 'M', label: 'Medium', desc: 'Medium confidentiality requirement' },
        { value: 'L', label: 'Low', desc: 'Low confidentiality requirement' }
      ]
    },
    IR: {
      name: 'Integrity Requirement',
      short: 'IR',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'Use default value' },
        { value: 'H', label: 'High', desc: 'High integrity requirement' },
        { value: 'M', label: 'Medium', desc: 'Medium integrity requirement' },
        { value: 'L', label: 'Low', desc: 'Low integrity requirement' }
      ]
    },
    AR: {
      name: 'Availability Requirement',
      short: 'AR',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'Use default value' },
        { value: 'H', label: 'High', desc: 'High availability requirement' },
        { value: 'M', label: 'Medium', desc: 'Medium availability requirement' },
        { value: 'L', label: 'Low', desc: 'Low availability requirement' }
      ]
    },
    MAV: {
      name: 'Modified Attack Vector',
      short: 'MAV',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'Use base value' },
        { value: 'N', label: 'Network' },
        { value: 'A', label: 'Adjacent' },
        { value: 'L', label: 'Local' },
        { value: 'P', label: 'Physical' }
      ]
    },
    MAC: {
      name: 'Modified Attack Complexity',
      short: 'MAC',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'Use base value' },
        { value: 'L', label: 'Low' },
        { value: 'H', label: 'High' }
      ]
    },
    MAT: {
      name: 'Modified Attack Requirements',
      short: 'MAT',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'Use base value' },
        { value: 'N', label: 'None' },
        { value: 'P', label: 'Present' }
      ]
    },
    MPR: {
      name: 'Modified Privileges Required',
      short: 'MPR',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'Use base value' },
        { value: 'N', label: 'None' },
        { value: 'L', label: 'Low' },
        { value: 'H', label: 'High' }
      ]
    },
    MUI: {
      name: 'Modified User Interaction',
      short: 'MUI',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'Use base value' },
        { value: 'N', label: 'None' },
        { value: 'P', label: 'Passive' },
        { value: 'A', label: 'Active' }
      ]
    },
    MVC: {
      name: 'Modified Vulnerable System Confidentiality',
      short: 'MVC',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'Use base value' },
        { value: 'H', label: 'High' },
        { value: 'L', label: 'Low' },
        { value: 'N', label: 'None' }
      ]
    },
    MVI: {
      name: 'Modified Vulnerable System Integrity',
      short: 'MVI',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'Use base value' },
        { value: 'H', label: 'High' },
        { value: 'L', label: 'Low' },
        { value: 'N', label: 'None' }
      ]
    },
    MVA: {
      name: 'Modified Vulnerable System Availability',
      short: 'MVA',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'Use base value' },
        { value: 'H', label: 'High' },
        { value: 'L', label: 'Low' },
        { value: 'N', label: 'None' }
      ]
    },
    MSC: {
      name: 'Modified Subsequent System Confidentiality',
      short: 'MSC',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'Use base value' },
        { value: 'H', label: 'High' },
        { value: 'L', label: 'Low' },
        { value: 'N', label: 'None' }
      ]
    },
    MSI: {
      name: 'Modified Subsequent System Integrity',
      short: 'MSI',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'Use base value' },
        { value: 'H', label: 'High' },
        { value: 'L', label: 'Low' },
        { value: 'N', label: 'None' }
      ]
    },
    MSA: {
      name: 'Modified Subsequent System Availability',
      short: 'MSA',
      options: [
        { value: 'X', label: 'Not Defined', desc: 'Use base value' },
        { value: 'H', label: 'High' },
        { value: 'L', label: 'Low' },
        { value: 'N', label: 'None' }
      ]
    }
  },

  // SUPPLEMENTAL METRICS (pas inclus dans le calcul du score)
  supplemental: {
    S: {
      name: 'Safety',
      short: 'S',
      options: [
        { value: 'X', label: 'Not Defined' },
        { value: 'N', label: 'Negligible' },
        { value: 'P', label: 'Present' }
      ]
    },
    AU: {
      name: 'Automatable',
      short: 'AU',
      options: [
        { value: 'X', label: 'Not Defined' },
        { value: 'N', label: 'No' },
        { value: 'Y', label: 'Yes' }
      ]
    },
    R: {
      name: 'Recovery',
      short: 'R',
      options: [
        { value: 'X', label: 'Not Defined' },
        { value: 'A', label: 'Automatic' },
        { value: 'U', label: 'User' },
        { value: 'I', label: 'Irrecoverable' }
      ]
    },
    V: {
      name: 'Value Density',
      short: 'V',
      options: [
        { value: 'X', label: 'Not Defined' },
        { value: 'D', label: 'Diffuse' },
        { value: 'C', label: 'Concentrated' }
      ]
    },
    RE: {
      name: 'Vulnerability Response Effort',
      short: 'RE',
      options: [
        { value: 'X', label: 'Not Defined' },
        { value: 'L', label: 'Low' },
        { value: 'M', label: 'Moderate' },
        { value: 'H', label: 'High' }
      ]
    },
    U: {
      name: 'Provider Urgency',
      short: 'U',
      options: [
        { value: 'X', label: 'Not Defined' },
        { value: 'Clear', label: 'Clear' },
        { value: 'Green', label: 'Green' },
        { value: 'Amber', label: 'Amber' },
        { value: 'Red', label: 'Red' }
      ]
    }
  }
};

function CVSSv4Calculator({ vulnerability, onSave, onClose }) {
  const [baseMetrics, setBaseMetrics] = useState({
    AV: null, AC: null, AT: null, PR: null, UI: null,
    VC: null, VI: null, VA: null, SC: null, SI: null, SA: null
  });

  const [threatMetrics, setThreatMetrics] = useState({ E: 'X' });

  const [environmentalMetrics, setEnvironmentalMetrics] = useState({
    CR: 'X', IR: 'X', AR: 'X',
    MAV: 'X', MAC: 'X', MAT: 'X', MPR: 'X', MUI: 'X',
    MVC: 'X', MVI: 'X', MVA: 'X', MSC: 'X', MSI: 'X', MSA: 'X'
  });

  const [supplementalMetrics, setSupplementalMetrics] = useState({
    S: 'X', AU: 'X', R: 'X', V: 'X', RE: 'X', U: 'X'
  });

  const [score, setScore] = useState(0);
  const [severity, setSeverity] = useState('NONE');

  // Ref for score animation
  const scoreRef = useRef(null);

  useEffect(() => {
    if (Object.values(baseMetrics).every(v => v !== null)) {
      calculateScore();
    } else {
      setScore(0);
      setSeverity('NONE');
    }
  }, [baseMetrics, threatMetrics, environmentalMetrics]);

  const getSeverity = (score) => {
    if (score === 0) return 'NONE';
    if (score < 4.0) return 'LOW';
    if (score < 7.0) return 'MEDIUM';
    if (score < 9.0) return 'HIGH';
    return 'CRITICAL';
  };

  // Animate score value when it changes
  const animateScoreChange = () => {
    if (scoreRef.current) {
      scoreRef.current.classList.add('updating');
      setTimeout(() => {
        scoreRef.current?.classList.remove('updating');
      }, 300);
    }
  };

  // CVSS v4.0 calculation using official MacroVector implementation
  const calculateScore = () => {
    // Prepare all metrics for the calculation
    const allMetrics = {
      // Base metrics
      ...baseMetrics,
      // Threat metrics
      E: threatMetrics.E || 'X',
      // Environmental metrics (requirements + modified base)
      CR: environmentalMetrics.CR || 'X',
      IR: environmentalMetrics.IR || 'X',
      AR: environmentalMetrics.AR || 'X',
      MAV: environmentalMetrics.MAV || 'X',
      MAC: environmentalMetrics.MAC || 'X',
      MAT: environmentalMetrics.MAT || 'X',
      MPR: environmentalMetrics.MPR || 'X',
      MUI: environmentalMetrics.MUI || 'X',
      MVC: environmentalMetrics.MVC || 'X',
      MVI: environmentalMetrics.MVI || 'X',
      MVA: environmentalMetrics.MVA || 'X',
      MSC: environmentalMetrics.MSC || 'X',
      MSI: environmentalMetrics.MSI || 'X',
      MSA: environmentalMetrics.MSA || 'X',
      // Supplemental metrics
      S: supplementalMetrics.S || 'X',
      AU: supplementalMetrics.AU || 'X',
      R: supplementalMetrics.R || 'X',
      V: supplementalMetrics.V || 'X',
      RE: supplementalMetrics.RE || 'X',
      U: supplementalMetrics.U || 'X'
    };
    
    // Calculate score using official MacroVector implementation
    const calculatedScore = calculateCVSS40Score(allMetrics);
    const calculatedSeverity = getCVSS40Severity(calculatedScore);
    
    // Get MacroVector for debugging (optional - can be displayed to user)
    const macroVector = getMacroVector(allMetrics);
    logger.debug('CVSS 4.0 MacroVector:', macroVector);
    
    // Animate the score change
    animateScoreChange();
    
    setScore(calculatedScore);
    setSeverity(calculatedSeverity);
  };

  const generateVector = () => {
    // Prepare all metrics for vector generation
    const allMetrics = {
      ...baseMetrics,
      E: threatMetrics.E || 'X',
      CR: environmentalMetrics.CR || 'X',
      IR: environmentalMetrics.IR || 'X',
      AR: environmentalMetrics.AR || 'X',
      MAV: environmentalMetrics.MAV || 'X',
      MAC: environmentalMetrics.MAC || 'X',
      MAT: environmentalMetrics.MAT || 'X',
      MPR: environmentalMetrics.MPR || 'X',
      MUI: environmentalMetrics.MUI || 'X',
      MVC: environmentalMetrics.MVC || 'X',
      MVI: environmentalMetrics.MVI || 'X',
      MVA: environmentalMetrics.MVA || 'X',
      MSC: environmentalMetrics.MSC || 'X',
      MSI: environmentalMetrics.MSI || 'X',
      MSA: environmentalMetrics.MSA || 'X',
      S: supplementalMetrics.S || 'X',
      AU: supplementalMetrics.AU || 'X',
      R: supplementalMetrics.R || 'X',
      V: supplementalMetrics.V || 'X',
      RE: supplementalMetrics.RE || 'X',
      U: supplementalMetrics.U || 'X'
    };
    
    // Use official vector generation
    return generateCVSS40Vector(allMetrics);
  };

  const handleSave = () => {
    if (Object.values(baseMetrics).some(v => v === null)) {
      alert('⚠️ Veuillez sélectionner toutes les métriques de base');
      return;
    }
    
    onSave({
      score: score,
      vector: generateVector(),
      severity: severity
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
                 setState === setThreatMetrics ? threatMetrics :
                 setState === setEnvironmentalMetrics ? environmentalMetrics :
                 supplementalMetrics;
    const selected = state[metricKey];
    const metricDescription = METRIC_DESCRIPTIONS[metric.name];

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
              <h2>🧮 Calculateur CVSS v4.0</h2>
              <p className="modal-subtitle">
                Common Vulnerability Scoring System Version 4.0
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
              <div className="score-card-header">CVSS v4.0 Score</div>
              <div className="score-card-body">
                <div className="score-value" ref={scoreRef}>{score.toFixed(1)}</div>
                <div className="score-severity" style={{ backgroundColor: getSeverityColor(severity) }}>
                  {severity}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-body">
          {/* CVE Info */}
          <div className="cvss-cve-info mb-4">
            <strong>{vulnerability.vulnerabilite || vulnerability.cveId}</strong> - {vulnerability.package_name || vulnerability.packageName}
            {Object.values(baseMetrics).every(v => v !== null) && (
              <div className="cvss-vector">{generateVector()}</div>
            )}
          </div>

          <div className="cvss-calculator-grid v4">
            {/* Column 1: Base Metrics */}
            <div className="cvss-column">
              <div className="cvss-group-container">
                <div className="cvss-group-header">Base Metrics</div>
                
                <div className="cvss-sub-group-header">Exploitability</div>
                {renderMetric('AV', CVSS_V4_METRICS.base, setBaseMetrics)}
                {renderMetric('AC', CVSS_V4_METRICS.base, setBaseMetrics)}
                {renderMetric('AT', CVSS_V4_METRICS.base, setBaseMetrics)}
                {renderMetric('PR', CVSS_V4_METRICS.base, setBaseMetrics)}
                {renderMetric('UI', CVSS_V4_METRICS.base, setBaseMetrics)}
                
                <div className="cvss-sub-group-header">Vulnerable System Impact</div>
                {renderMetric('VC', CVSS_V4_METRICS.base, setBaseMetrics)}
                {renderMetric('VI', CVSS_V4_METRICS.base, setBaseMetrics)}
                {renderMetric('VA', CVSS_V4_METRICS.base, setBaseMetrics)}
                
                <div className="cvss-sub-group-header">Subsequent System Impact</div>
                {renderMetric('SC', CVSS_V4_METRICS.base, setBaseMetrics)}
                {renderMetric('SI', CVSS_V4_METRICS.base, setBaseMetrics)}
                {renderMetric('SA', CVSS_V4_METRICS.base, setBaseMetrics)}
              </div>
            </div>

            {/* Column 2: Threat Metrics */}
            <div className="cvss-column">
              <div className="cvss-group-container">
                <div className="cvss-group-header">Threat Metrics</div>
                {renderMetric('E', CVSS_V4_METRICS.threat, setThreatMetrics)}
              </div>
            </div>

            {/* Column 3: Environmental Metrics */}
            <div className="cvss-column">
              <div className="cvss-group-container">
                <div className="cvss-group-header">Environmental Metrics</div>
                
                <div className="cvss-sub-group-header">Security Requirements</div>
                {renderMetric('CR', CVSS_V4_METRICS.environmental, setEnvironmentalMetrics)}
                {renderMetric('IR', CVSS_V4_METRICS.environmental, setEnvironmentalMetrics)}
                {renderMetric('AR', CVSS_V4_METRICS.environmental, setEnvironmentalMetrics)}
                
                <div className="cvss-sub-group-header">Modified Exploitability</div>
                {renderMetric('MAV', CVSS_V4_METRICS.environmental, setEnvironmentalMetrics)}
                {renderMetric('MAC', CVSS_V4_METRICS.environmental, setEnvironmentalMetrics)}
                {renderMetric('MAT', CVSS_V4_METRICS.environmental, setEnvironmentalMetrics)}
                {renderMetric('MPR', CVSS_V4_METRICS.environmental, setEnvironmentalMetrics)}
                {renderMetric('MUI', CVSS_V4_METRICS.environmental, setEnvironmentalMetrics)}
                
                <div className="cvss-sub-group-header">Modified Vuln. System Impact</div>
                {renderMetric('MVC', CVSS_V4_METRICS.environmental, setEnvironmentalMetrics)}
                {renderMetric('MVI', CVSS_V4_METRICS.environmental, setEnvironmentalMetrics)}
                {renderMetric('MVA', CVSS_V4_METRICS.environmental, setEnvironmentalMetrics)}
                
                <div className="cvss-sub-group-header">Modified Sub. System Impact</div>
                {renderMetric('MSC', CVSS_V4_METRICS.environmental, setEnvironmentalMetrics)}
                {renderMetric('MSI', CVSS_V4_METRICS.environmental, setEnvironmentalMetrics)}
                {renderMetric('MSA', CVSS_V4_METRICS.environmental, setEnvironmentalMetrics)}
              </div>
            </div>

            {/* Column 4: Supplemental Metrics */}
            <div className="cvss-column">
              <div className="cvss-group-container">
                <div className="cvss-group-header">Supplemental Metrics</div>
                {renderMetric('S', CVSS_V4_METRICS.supplemental, setSupplementalMetrics)}
                {renderMetric('AU', CVSS_V4_METRICS.supplemental, setSupplementalMetrics)}
                {renderMetric('R', CVSS_V4_METRICS.supplemental, setSupplementalMetrics)}
                {renderMetric('V', CVSS_V4_METRICS.supplemental, setSupplementalMetrics)}
                {renderMetric('RE', CVSS_V4_METRICS.supplemental, setSupplementalMetrics)}
                {renderMetric('U', CVSS_V4_METRICS.supplemental, setSupplementalMetrics)}
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

export default CVSSv4Calculator;