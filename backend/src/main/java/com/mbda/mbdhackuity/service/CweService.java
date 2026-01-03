package com.mbda.mbdhackuity.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class CweService {

    public static class CweInfo {
        public final String name; // short name/type d'attaque
        public final String description; // full description
        public CweInfo(String name, String description) {
            this.name = name;
            this.description = description;
        }
    }

    private static final Map<String, CweInfo> CWE_INFOS = new HashMap<>();

    static {
                                                                                                // --- Added more missing CWEs ---
                                                                                                CWE_INFOS.put("CWE-1327", new CweInfo(
                                                                                                    "Binding to an Unrestricted IP Address",
                                                                                                    "The software binds to an IP address that is not properly restricted, allowing unauthorized access."
                                                                                                ));
                                                                                                CWE_INFOS.put("CWE-201", new CweInfo(
                                                                                                    "Information Exposure Through Sent Data",
                                                                                                    "The software exposes sensitive information through data that is sent to another actor, such as in network traffic."
                                                                                                ));
                                                                                                CWE_INFOS.put("CWE-17", new CweInfo(
                                                                                                    "Code",
                                                                                                    "The software contains weaknesses related to code implementation, leading to vulnerabilities."
                                                                                                ));
                                                                                                CWE_INFOS.put("CWE-208", new CweInfo(
                                                                                                    "Observable Timing Discrepancy",
                                                                                                    "The software provides different response times based on sensitive information, allowing attackers to infer confidential data."
                                                                                                ));
                                                                                                CWE_INFOS.put("CWE-253", new CweInfo(
                                                                                                    "Incorrect Check of Function Return Value",
                                                                                                    "The software does not properly check the return value of a function, leading to missed error conditions and vulnerabilities."
                                                                                                ));
                                                                                                CWE_INFOS.put("CWE-24", new CweInfo(
                                                                                                    "Path Traversal: '\\..\\filename' (Windows)",
                                                                                                    "The software does not properly restrict the path used for file access, allowing attackers to access files outside of the intended directory using Windows-style path traversal sequences."
                                                                                                ));
                                                                                        // --- Added more missing CWEs ---
                                                                                        CWE_INFOS.put("CWE-311", new CweInfo(
                                                                                            "Missing Encryption of Sensitive Data",
                                                                                            "The software does not encrypt sensitive or security-critical data, making it accessible to attackers."
                                                                                        ));
                                                                                        CWE_INFOS.put("CWE-674", new CweInfo(
                                                                                            "Uncontrolled Recursion",
                                                                                            "The software allows uncontrolled recursion, leading to stack exhaustion and denial of service."
                                                                                        ));
                                                                                        CWE_INFOS.put("CWE-316", new CweInfo(
                                                                                            "Inclusion of Sensitive Information in Log Files",
                                                                                            "The software logs sensitive information, making it accessible to unauthorized users."
                                                                                        ));
                                                                                        CWE_INFOS.put("CWE-256", new CweInfo(
                                                                                            "Plaintext Storage of a Password",
                                                                                            "The software stores passwords in plaintext, making them accessible to attackers."
                                                                                        ));
                                                                                        CWE_INFOS.put("CWE-457", new CweInfo(
                                                                                            "Use of Uninitialized Variable",
                                                                                            "The software uses a variable before it has been initialized, leading to unpredictable behavior or vulnerabilities."
                                                                                        ));
                                                                                        CWE_INFOS.put("CWE-591", new CweInfo(
                                                                                            "Sensitive Data Storage in Improperly Protected Storage",
                                                                                            "The software stores sensitive data in a location that is not properly protected, making it accessible to attackers."
                                                                                        ));
                                                                                        CWE_INFOS.put("CWE-640", new CweInfo(
                                                                                            "Weak Password Recovery Mechanism for Forgotten Password",
                                                                                            "The software implements a password recovery mechanism that is weak, allowing attackers to gain unauthorized access."
                                                                                        ));
                                                                                        CWE_INFOS.put("CWE-565", new CweInfo(
                                                                                            "Reliance on Cookies without Validation and Integrity Checking",
                                                                                            "The software relies on cookies for security decisions without validating or checking their integrity, allowing attackers to manipulate them."
                                                                                        ));
                                                                                        CWE_INFOS.put("CWE-356", new CweInfo(
                                                                                            "Product UI does not Warn User of Unsafe Actions",
                                                                                            "The software's user interface does not warn users of unsafe actions, leading to security risks."
                                                                                        ));
                                                                                        CWE_INFOS.put("CWE-338", new CweInfo(
                                                                                            "Use of Cryptographically Weak Pseudo-Random Number Generator (PRNG)",
                                                                                            "The software uses a PRNG that is not cryptographically strong, making it easier for attackers to predict values."
                                                                                        ));
                                                                                        CWE_INFOS.put("CWE-351", new CweInfo(
                                                                                            "Insufficient Type Distinction",
                                                                                            "The software does not sufficiently distinguish between types, leading to type confusion and vulnerabilities."
                                                                                        ));
                                                                                        CWE_INFOS.put("CWE-431", new CweInfo(
                                                                                            "Missing Handler for Resource Cleanup on Termination",
                                                                                            "The software does not handle resource cleanup when terminating, leading to resource leaks."
                                                                                        ));
                                                                                        CWE_INFOS.put("CWE-305", new CweInfo(
                                                                                            "Authentication Bypass by Primary Weakness",
                                                                                            "The software can be bypassed due to a primary weakness in authentication, allowing unauthorized access."
                                                                                        ));
                                                                                        CWE_INFOS.put("CWE-617", new CweInfo(
                                                                                            "Reachable Assertion",
                                                                                            "The software contains an assertion that can be reached and triggered by an attacker, leading to denial of service."
                                                                                        ));
                                                                                        CWE_INFOS.put("CWE-99", new CweInfo(
                                                                                            "Improper Control of Resource Identifiers ('Resource Injection')",
                                                                                            "The software does not properly control resource identifiers, allowing attackers to inject malicious resources."
                                                                                        ));
                                                                                        CWE_INFOS.put("CWE-288", new CweInfo(
                                                                                            "Authentication Bypass Using an Alternate Path or Channel",
                                                                                            "The software can be bypassed by using an alternate path or channel, allowing unauthorized access."
                                                                                        ));
                                                                                // --- Added more missing CWEs ---
                                                                                CWE_INFOS.put("CWE-665", new CweInfo(
                                                                                    "Improper Initialization",
                                                                                    "The software does not initialize data or resources properly, leading to unpredictable behavior or vulnerabilities."
                                                                                ));
                                                                                CWE_INFOS.put("CWE-664", new CweInfo(
                                                                                    "Improper Control of a Resource Through its Lifetime",
                                                                                    "The software does not properly control a resource throughout its lifetime, leading to vulnerabilities such as use-after-free or resource leaks."
                                                                                ));
                                                                                CWE_INFOS.put("CWE-86", new CweInfo(
                                                                                    "Improper Neutralization of Invalid Characters in Identifiers in Web Pages",
                                                                                    "The software does not neutralize invalid characters in identifiers in web pages, leading to security vulnerabilities."
                                                                                ));
                                                                                CWE_INFOS.put("CWE-297", new CweInfo(
                                                                                    "Improper Validation of Certificate with Host Mismatch",
                                                                                    "The software does not properly validate certificates when the host does not match, allowing attackers to spoof trusted entities."
                                                                                ));
                                                                                CWE_INFOS.put("CWE-922", new CweInfo(
                                                                                    "Insecure Storage of Sensitive Information",
                                                                                    "The software stores sensitive information insecurely, making it accessible to attackers."
                                                                                ));
                                                                                CWE_INFOS.put("CWE-240", new CweInfo(
                                                                                    "Improper Handling of Unexpected Data Type",
                                                                                    "The software does not properly handle unexpected data types, leading to unpredictable behavior or vulnerabilities."
                                                                                ));
                                                                                CWE_INFOS.put("CWE-209", new CweInfo(
                                                                                    "Information Exposure Through an Error Message",
                                                                                    "The software exposes sensitive information through error messages, allowing attackers to gain insight into the system."
                                                                                ));
                                                                                CWE_INFOS.put("CWE-470", new CweInfo(
                                                                                    "Use of Externally-Controlled Input to Select Classes or Code ('Unsafe Reflection')",
                                                                                    "The software uses externally-controlled input to select classes or code, leading to code execution or other vulnerabilities."
                                                                                ));
                                                                                CWE_INFOS.put("CWE-425", new CweInfo(
                                                                                    "Direct Request ('Forced Browsing')",
                                                                                    "The software allows direct requests to resources that should be restricted, leading to unauthorized access."
                                                                                ));
                                                                                CWE_INFOS.put("CWE-326", new CweInfo(
                                                                                    "Inadequate Encryption Strength",
                                                                                    "The software uses encryption that is not strong enough, allowing attackers to break the encryption and access sensitive data."
                                                                                ));
                                                                                CWE_INFOS.put("CWE-758", new CweInfo(
                                                                                    "Reliance on Undefined, Unspecified, or Implementation-Defined Behavior",
                                                                                    "The software relies on behavior that is undefined, unspecified, or implementation-defined, leading to unpredictable results or vulnerabilities."
                                                                                ));
                                                                                CWE_INFOS.put("CWE-248", new CweInfo(
                                                                                    "Uncaught Exception",
                                                                                    "The software does not catch exceptions, leading to crashes or unpredictable behavior."
                                                                                ));
                                                                                CWE_INFOS.put("CWE-369", new CweInfo(
                                                                                    "Divide By Zero",
                                                                                    "The software performs a division by zero, leading to crashes or unpredictable behavior."
                                                                                ));
                                                                        // --- Added more missing CWEs ---
                                                                        CWE_INFOS.put("CWE-367", new CweInfo(
                                                                            "Time-of-check Time-of-use (TOCTOU) Race Condition",
                                                                            "The software checks the state of a resource before using it, but the resource's state can change between the check and the use, leading to race conditions and vulnerabilities."
                                                                        ));
                                                                        CWE_INFOS.put("CWE-611", new CweInfo(
                                                                            "Improper Restriction of XML External Entity Reference (XXE)",
                                                                            "The software processes XML input containing a reference to an external entity, but does not properly restrict the reference, allowing attackers to access sensitive data or cause denial of service."
                                                                        ));
                                                                        CWE_INFOS.put("CWE-862", new CweInfo(
                                                                            "Missing Authorization",
                                                                            "The software does not perform an authorization check when a user attempts to access a resource, leading to unauthorized access."
                                                                        ));
                                                                        CWE_INFOS.put("CWE-310", new CweInfo(
                                                                            "Cryptographic Issues",
                                                                            "The software contains cryptographic issues, such as weak algorithms or improper implementation, leading to vulnerabilities."
                                                                        ));
                                                                        CWE_INFOS.put("CWE-776", new CweInfo(
                                                                            "Improper Restriction of Recursive Entity References in DTDs (XML Entity Expansion)",
                                                                            "The software does not properly restrict the number of recursive entity references in DTDs, leading to denial of service via XML Entity Expansion attacks."
                                                                        ));
                                                                        CWE_INFOS.put("CWE-177", new CweInfo(
                                                                            "Improper Handling of Unicode Encoding",
                                                                            "The software does not properly handle Unicode encoding, leading to security vulnerabilities or incorrect behavior."
                                                                        ));
                                                                        CWE_INFOS.put("CWE-252", new CweInfo(
                                                                            "Unchecked Return Value",
                                                                            "The software does not check the return value from a function or method, leading to missed error conditions and vulnerabilities."
                                                                        ));
                                                                        CWE_INFOS.put("CWE-838", new CweInfo(
                                                                            "Inappropriate Encoding for Output Context",
                                                                            "The software uses an encoding that is inappropriate for the output context, leading to security vulnerabilities."
                                                                        ));
                                                                        CWE_INFOS.put("CWE-823", new CweInfo(
                                                                            "Use of Out-of-range Pointer Offset",
                                                                            "The software uses a pointer offset that is outside the bounds of the intended object, leading to unpredictable behavior or vulnerabilities."
                                                                        ));
                                                                        CWE_INFOS.put("CWE-403", new CweInfo(
                                                                            "Incomplete Internal State Distinction",
                                                                            "The software does not properly distinguish between different internal states, leading to incorrect behavior or vulnerabilities."
                                                                        ));
                                                                        CWE_INFOS.put("CWE-158", new CweInfo(
                                                                            "Improper Neutralization of Null Byte or NUL Character",
                                                                            "The software does not properly neutralize null bytes or NUL characters, leading to security vulnerabilities."
                                                                        ));
                                                                        CWE_INFOS.put("CWE-23", new CweInfo(
                                                                            "Relative Path Traversal",
                                                                            "The software does not properly restrict the path used for file access, allowing attackers to access files outside of the intended directory via relative path traversal sequences."
                                                                        ));
                                                                        CWE_INFOS.put("CWE-786", new CweInfo(
                                                                            "Access of Memory Location Before Start of Buffer",
                                                                            "The software reads from or writes to a memory location before the start of a buffer, leading to unpredictable behavior or vulnerabilities."
                                                                        ));
                                                                        CWE_INFOS.put("CWE-788", new CweInfo(
                                                                            "Access of Memory Location After End of Buffer",
                                                                            "The software reads from or writes to a memory location after the end of a buffer, leading to unpredictable behavior or vulnerabilities."
                                                                        ));
                                                                        CWE_INFOS.put("CWE-697", new CweInfo(
                                                                            "Incorrect Comparison",
                                                                            "The software performs an incorrect comparison, leading to incorrect behavior or vulnerabilities."
                                                                        ));
                                                                // --- Added more missing CWEs ---
                                                                CWE_INFOS.put("CWE-763", new CweInfo(
                                                                    "Release of Invalid Pointer or Reference",
                                                                    "The software releases a pointer or reference that is invalid, leading to unpredictable behavior or vulnerabilities."
                                                                ));
                                                                CWE_INFOS.put("CWE-680", new CweInfo(
                                                                    "Integer Overflow to Buffer Overflow",
                                                                    "The software performs a calculation that can result in an integer overflow, which is then used in a buffer allocation, leading to buffer overflows."
                                                                ));
                                                                CWE_INFOS.put("CWE-83", new CweInfo(
                                                                    "Improper Neutralization of Script in Attributes in a Web Page",
                                                                    "The software does not neutralize scripts in attributes of a web page, allowing attackers to execute scripts in the victim's browser."
                                                                ));
                                                                CWE_INFOS.put("CWE-134", new CweInfo(
                                                                    "Use of Externally-Controlled Format String",
                                                                    "The software uses a format string that is influenced by external input, leading to code execution or data corruption."
                                                                ));
                                                                CWE_INFOS.put("CWE-282", new CweInfo(
                                                                    "Improper Ownership Management",
                                                                    "The software does not properly manage ownership of resources, allowing unauthorized access or modification."
                                                                ));
                                                                CWE_INFOS.put("CWE-427", new CweInfo(
                                                                    "Uncontrolled Search Path Element",
                                                                    "The software uses a search path that can be influenced by an attacker, leading to execution of malicious code."
                                                                ));
                                                                CWE_INFOS.put("CWE-552", new CweInfo(
                                                                    "Files or Directories Accessible to External Parties",
                                                                    "The software makes files or directories accessible to external parties, leading to information disclosure or modification."
                                                                ));
                                                                CWE_INFOS.put("CWE-285", new CweInfo(
                                                                    "Improper Authorization",
                                                                    "The software does not properly restrict access to resources, allowing unauthorized actions."
                                                                ));
                                                                CWE_INFOS.put("CWE-275", new CweInfo(
                                                                    "Permission Issues",
                                                                    "The software does not properly assign, manage, or check permissions, leading to unauthorized access."
                                                                ));
                                                                CWE_INFOS.put("CWE-347", new CweInfo(
                                                                    "Improper Verification of Cryptographic Signature",
                                                                    "The software does not properly verify cryptographic signatures, allowing attackers to bypass security mechanisms."
                                                                ));
                                                                CWE_INFOS.put("CWE-399", new CweInfo(
                                                                    "Resource Management Errors",
                                                                    "The software does not properly manage resources, leading to leaks, exhaustion, or other vulnerabilities."
                                                                ));
                                                                CWE_INFOS.put("CWE-1188", new CweInfo(
                                                                    "Insecure Default Initialization of Resource",
                                                                    "The software initializes resources with insecure default values, leading to vulnerabilities."
                                                                ));
                                                                CWE_INFOS.put("CWE-254", new CweInfo(
                                                                    "Security Features",
                                                                    "The software contains weaknesses in security features, leading to vulnerabilities."
                                                                ));
                                                                CWE_INFOS.put("CWE-386", new CweInfo(
                                                                    "Symbolic Name not Mapping to Correct Object",
                                                                    "The software uses a symbolic name that does not map to the correct object, leading to unintended behavior or vulnerabilities."
                                                                ));
                                                                CWE_INFOS.put("CWE-489", new CweInfo(
                                                                    "Leftover Debug Code",
                                                                    "The software contains debug code that was not removed before release, which can expose sensitive information or functionality."
                                                                ));
                                                        // --- Added more missing CWEs ---
                                                        CWE_INFOS.put("CWE-401", new CweInfo(
                                                            "Missing Release of Memory after Effective Lifetime (Memory Leak)",
                                                            "The software does not release memory after it has been used, leading to memory leaks and potential denial of service."
                                                        ));
                                                        CWE_INFOS.put("CWE-404", new CweInfo(
                                                            "Improper Resource Shutdown or Release",
                                                            "The software does not properly release or shutdown resources, such as files or network connections, leading to resource leaks."
                                                        ));
                                                        CWE_INFOS.put("CWE-377", new CweInfo(
                                                            "Insecure Temporary File",
                                                            "The software creates temporary files in an insecure manner, allowing attackers to access or modify them."
                                                        ));
                                                        CWE_INFOS.put("CWE-459", new CweInfo(
                                                            "Incomplete Cleanup",
                                                            "The software does not properly clean up resources or data, leaving sensitive information accessible to attackers."
                                                        ));
                                                        CWE_INFOS.put("CWE-312", new CweInfo(
                                                            "Cleartext Storage of Sensitive Information",
                                                            "The software stores sensitive information in cleartext, making it accessible to attackers."
                                                        ));
                                                        CWE_INFOS.put("CWE-255", new CweInfo(
                                                            "Credentials Management Errors",
                                                            "The software does not properly manage credentials, leading to unauthorized access or disclosure."
                                                        ));
                                                        CWE_INFOS.put("CWE-592", new CweInfo(
                                                            "Missing Authentication for Critical Function",
                                                            "The software does not require authentication for a critical function, allowing attackers to perform unauthorized actions."
                                                        ));
                                                        CWE_INFOS.put("CWE-359", new CweInfo(
                                                            "Exposure of Private Personal Information to an Unauthorized Actor",
                                                            "The software exposes private personal information to an actor that is not explicitly authorized to have access to that information."
                                                        ));
                                                        CWE_INFOS.put("CWE-212", new CweInfo(
                                                            "Improper Cross-boundary Removal of Sensitive Data",
                                                            "The software does not properly remove sensitive data when crossing a trust boundary, leading to information disclosure."
                                                        ));
                                                        CWE_INFOS.put("CWE-835", new CweInfo(
                                                            "Loop with Unreachable Exit Condition (Infinite Loop)",
                                                            "The software contains a loop whose exit condition can never be met, leading to infinite loops and denial of service."
                                                        ));
                                                        CWE_INFOS.put("CWE-325", new CweInfo(
                                                            "Missing Required Cryptographic Step",
                                                            "The software does not perform a required cryptographic step, weakening the security of the cryptographic process."
                                                        ));
                                                        CWE_INFOS.put("CWE-203", new CweInfo(
                                                            "Observable Discrepancy",
                                                            "The software provides different responses or behaviors based on sensitive information, allowing attackers to infer confidential data."
                                                        ));
                                                        CWE_INFOS.put("CWE-703", new CweInfo(
                                                            "Improper Check or Handling of Exceptional Conditions",
                                                            "The software does not properly check or handle exceptional conditions, leading to unexpected behavior or vulnerabilities."
                                                        ));
                                                // --- Added more missing CWEs ---
                                                CWE_INFOS.put("CWE-74", new CweInfo(
                                                    "Improper Neutralization of Special Elements in Output Used by a Downstream Component ('Injection')",
                                                    "The software does not neutralize or incorrectly neutralizes special elements that are used in output, which is then processed by a downstream component, leading to injection vulnerabilities."
                                                ));
                                                CWE_INFOS.put("CWE-75", new CweInfo(
                                                    "Failure to Sanitize Special Elements into a Different Plane (Special Element Injection)",
                                                    "The software does not properly sanitize special elements that are interpreted differently by downstream components, leading to injection attacks."
                                                ));
                                                CWE_INFOS.put("CWE-19", new CweInfo(
                                                    "Data Handling Errors",
                                                    "The software does not properly handle data, leading to unexpected behavior or vulnerabilities."
                                                ));
                                                CWE_INFOS.put("CWE-73", new CweInfo(
                                                    "External Control of File Name or Path",
                                                    "The software uses external input to construct a file name or path, allowing attackers to access or modify unintended files."
                                                ));
                                                CWE_INFOS.put("CWE-829", new CweInfo(
                                                    "Inclusion of Functionality from Untrusted Control Sphere",
                                                    "The software includes functionality from an untrusted source, which can introduce malicious behavior."
                                                ));
                                                CWE_INFOS.put("CWE-672", new CweInfo(
                                                    "Operation on Resource after Expiration or Release",
                                                    "The software performs operations on a resource after it has been expired or released, leading to unpredictable behavior."
                                                ));
                                                CWE_INFOS.put("CWE-824", new CweInfo(
                                                    "Access of Uninitialized Pointer",
                                                    "The software accesses a pointer that has not been initialized, leading to unpredictable behavior or crashes."
                                                ));
                                                CWE_INFOS.put("CWE-273", new CweInfo(
                                                    "Improper Check for Dropped Privileges",
                                                    "The software does not properly check if privileges have been dropped, allowing attackers to gain elevated privileges."
                                                ));
                                                CWE_INFOS.put("CWE-179", new CweInfo(
                                                    "Incorrect Behavior Order: Early Validation",
                                                    "The software performs validation too early, before all relevant data is available, leading to incorrect decisions or vulnerabilities."
                                                ));
                                                CWE_INFOS.put("CWE-1104", new CweInfo(
                                                    "Use of Unmaintained Third Party Components",
                                                    "The software uses third-party components that are no longer maintained, increasing the risk of vulnerabilities."
                                                ));
                                                CWE_INFOS.put("CWE-88", new CweInfo(
                                                    "Argument Injection or Modification",
                                                    "The software allows injection or modification of arguments, leading to unintended behavior or vulnerabilities."
                                                ));
                                                CWE_INFOS.put("CWE-122", new CweInfo(
                                                    "Heap-based Buffer Overflow",
                                                    "The software writes to a buffer on the heap without proper bounds checking, leading to buffer overflows, code execution, or crashes."
                                                ));
                                                CWE_INFOS.put("CWE-1284", new CweInfo(
                                                    "Improper Validation of Specified Quantity in Input",
                                                    "The software does not properly validate the quantity specified in input, leading to resource exhaustion or other vulnerabilities."
                                                ));
                                                CWE_INFOS.put("CWE-522", new CweInfo(
                                                    "Insufficiently Protected Credentials",
                                                    "The software does not adequately protect credentials, allowing attackers to gain unauthorized access."
                                                ));
                                                CWE_INFOS.put("CWE-277", new CweInfo(
                                                    "Insecure Inherited Permissions",
                                                    "The software inherits insecure permissions from parent objects, leading to unauthorized access."
                                                ));
                                                CWE_INFOS.put("CWE-96", new CweInfo(
                                                    "Improper Neutralization of Directives in Statically Saved Code ('Static Code Injection')",
                                                    "The software does not properly neutralize directives in statically saved code, leading to code injection vulnerabilities."
                                                ));
                                                CWE_INFOS.put("CWE-660", new CweInfo(
                                                    "Improper Handling of Operations that Cross Privilege Boundaries",
                                                    "The software does not properly handle operations that cross privilege boundaries, leading to privilege escalation or other vulnerabilities."
                                                ));
                                                CWE_INFOS.put("CWE-830", new CweInfo(
                                                    "Inclusion of Web Functionality from an Untrusted Source",
                                                    "The software includes web functionality from an untrusted source, which can introduce malicious behavior."
                                                ));
                                                CWE_INFOS.put("CWE-80", new CweInfo(
                                                    "Improper Neutralization of Script-Related HTML Tags in a Web Page (Basic XSS)",
                                                    "The software does not neutralize script-related HTML tags in a web page, allowing attackers to execute scripts in the victim's browser."
                                                ));
                                                CWE_INFOS.put("CWE-706", new CweInfo(
                                                    "Use of Incorrectly-Resolved Name or Reference",
                                                    "The software uses a name or reference that is incorrectly resolved, leading to unintended behavior or vulnerabilities."
                                                ));
                                                CWE_INFOS.put("CWE-306", new CweInfo(
                                                    "Missing Authentication for Critical Function",
                                                    "The software does not require authentication for a critical function, allowing attackers to perform unauthorized actions."
                                                ));
                                                CWE_INFOS.put("CWE-350", new CweInfo(
                                                    "Reliance on Reverse DNS Resolution for a Security-Critical Action",
                                                    "The software relies on reverse DNS resolution for a security-critical action, which can be spoofed by attackers."
                                                ));
                                                CWE_INFOS.put("CWE-123", new CweInfo(
                                                    "Write-what-where Condition",
                                                    "The software allows writing to an arbitrary location, leading to code execution or data corruption."
                                                ));
                                                CWE_INFOS.put("CWE-436", new CweInfo(
                                                    "Interpretation Conflict",
                                                    "The software has conflicting interpretations of input or data, leading to vulnerabilities."
                                                ));
                                                CWE_INFOS.put("CWE-129", new CweInfo(
                                                    "Improper Validation of Array Index",
                                                    "The software does not properly validate an array index, leading to out-of-bounds access or other vulnerabilities."
                                                ));
                                        // --- Added more missing CWEs ---
                                        CWE_INFOS.put("CWE-191", new CweInfo(
                                            "Integer Underflow (Wrap or Wraparound)",
                                            "The software performs a calculation that can produce an integer underflow, resulting in an unexpected wraparound value. This can lead to incorrect results or security vulnerabilities."
                                        ));
                                        CWE_INFOS.put("CWE-116", new CweInfo(
                                            "Improper Encoding or Escaping of Output",
                                            "The software does not properly encode or escape output, allowing attackers to inject malicious data into the output stream, leading to security vulnerabilities such as XSS."
                                        ));
                                        CWE_INFOS.put("CWE-614", new CweInfo(
                                            "Sensitive Cookie in HTTPS Session Without 'Secure' Attribute",
                                            "The software uses a cookie to store sensitive information without setting the 'Secure' attribute, allowing the cookie to be transmitted over unencrypted connections."
                                        ));
                                        CWE_INFOS.put("CWE-476", new CweInfo(
                                            "NULL Pointer Dereference",
                                            "A NULL pointer dereference occurs when the software dereferences a pointer that it expects to be valid, but is NULL, causing a crash or other unintended behavior."
                                        ));
                                        CWE_INFOS.put("CWE-653", new CweInfo(
                                            "Insufficient Compartmentalization",
                                            "The software does not sufficiently compartmentalize functionality or data, allowing attackers to exploit one part of the system to affect other parts."
                                        ));
                                        CWE_INFOS.put("CWE-319", new CweInfo(
                                            "Cleartext Transmission of Sensitive Information",
                                            "The software transmits sensitive or security-critical information in cleartext over a network, making it accessible to attackers."
                                        ));
                                        CWE_INFOS.put("CWE-1021", new CweInfo(
                                            "Improper Restriction of Rendered UI Layers or Frames",
                                            "The software does not properly restrict which UI layers or frames can be rendered, allowing attackers to overlay malicious content."
                                        ));
                                        CWE_INFOS.put("CWE-287", new CweInfo(
                                            "Improper Authentication",
                                            "The software does not properly authenticate users or entities, allowing attackers to gain unauthorized access."
                                        ));
                                        CWE_INFOS.put("CWE-639", new CweInfo(
                                            "Authorization Bypass Through User-Controlled Key",
                                            "The software uses user-controlled keys to access resources, allowing attackers to bypass authorization."
                                        ));
                                        CWE_INFOS.put("CWE-1321", new CweInfo(
                                            "Improperly Implemented Security Check for Standard",
                                            "The software implements a security check for a standard incorrectly, leading to a false sense of security or bypass."
                                        ));
                                        CWE_INFOS.put("CWE-281", new CweInfo(
                                            "Improper Preservation of Permissions",
                                            "The software does not properly preserve permissions when performing operations, allowing unauthorized access."
                                        ));
                                        CWE_INFOS.put("CWE-290", new CweInfo(
                                            "Authentication Bypass by Spoofing",
                                            "The software can be tricked into granting access to unauthorized users by spoofing authentication credentials."
                                        ));
                                        CWE_INFOS.put("CWE-754", new CweInfo(
                                            "Improper Check for Unusual or Exceptional Conditions",
                                            "The software does not properly check for unusual or exceptional conditions, leading to unexpected behavior or vulnerabilities."
                                        ));
                                        CWE_INFOS.put("CWE-352", new CweInfo(
                                            "Cross-Site Request Forgery (CSRF)",
                                            "The software does not, or incorrectly, neutralizes user-controllable input before it is placed in output that is used as a web page that is served to other users, allowing attackers to perform actions on behalf of the user."
                                        ));
                                        CWE_INFOS.put("CWE-387", new CweInfo(
                                            "Use of Uninitialized Resource",
                                            "The software uses a resource before it has been properly initialized, leading to unpredictable behavior or vulnerabilities."
                                        ));
                                        CWE_INFOS.put("CWE-755", new CweInfo(
                                            "Improper Handling of Exceptional Conditions",
                                            "The software does not properly handle exceptional conditions, leading to unexpected behavior or vulnerabilities."
                                        ));
                                        CWE_INFOS.put("CWE-121", new CweInfo(
                                            "Stack-based Buffer Overflow",
                                            "The software writes to a buffer on the stack without proper bounds checking, leading to buffer overflows, code execution, or crashes."
                                        ));
                                        CWE_INFOS.put("CWE-78", new CweInfo(
                                            "Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')",
                                            "The software constructs OS commands using untrusted input, allowing attackers to execute arbitrary commands on the system."
                                        ));
                                // --- Added more missing CWEs ---
                                CWE_INFOS.put("CWE-704", new CweInfo(
                                    "Incorrect Type Conversion or Cast",
                                    "The software does not correctly convert or cast a variable to the appropriate type, which can lead to unpredictable behavior, crashes, or security vulnerabilities."
                                ));
                                CWE_INFOS.put("CWE-189", new CweInfo(
                                    "Numeric Errors",
                                    "The software performs a calculation that can produce incorrect or unintended results due to numeric errors such as overflow, underflow, loss of precision, or rounding."
                                ));
                                CWE_INFOS.put("CWE-345", new CweInfo(
                                    "Insufficient Verification of Data Authenticity",
                                    "The software does not sufficiently verify the authenticity of data, allowing attackers to inject or modify data without detection."
                                ));
                                CWE_INFOS.put("CWE-321", new CweInfo(
                                    "Use of Hard-coded Cryptographic Key",
                                    "The software uses a hard-coded cryptographic key, making it easier for attackers to bypass encryption and gain unauthorized access to sensitive data."
                                ));
                                CWE_INFOS.put("CWE-415", new CweInfo(
                                    "Double Free",
                                    "The software calls free() or a similar routine twice on the same memory address, which can lead to memory corruption, crashes, or code execution."
                                ));
                                CWE_INFOS.put("CWE-200", new CweInfo(
                                    "Exposure of Sensitive Information to an Unauthorized Actor",
                                    "The software exposes sensitive information to an actor that is not explicitly authorized to have access to that information."
                                ));
                                CWE_INFOS.put("CWE-840", new CweInfo(
                                    "Business Logic Errors",
                                    "The software contains business logic errors that allow attackers to exploit the intended functionality of the application for malicious purposes."
                                ));
                                CWE_INFOS.put("CWE-681", new CweInfo(
                                    "Incorrect Conversion between Numeric Types",
                                    "The software incorrectly converts a value between different numeric types, which can lead to loss of data, precision, or security vulnerabilities."
                                ));
                                CWE_INFOS.put("CWE-346", new CweInfo(
                                    "Origin Validation Error",
                                    "The software does not properly validate the origin of a request, message, or data, allowing attackers to bypass security controls or perform unauthorized actions."
                                ));
                                CWE_INFOS.put("CWE-120", new CweInfo(
                                    "Buffer Copy without Checking Size of Input ('Classic Buffer Overflow')",
                                    "The software copies data to a buffer without checking the size of the input, which can lead to buffer overflows, code execution, or crashes."
                                ));
                                CWE_INFOS.put("CWE-451", new CweInfo(
                                    "User Interface (UI) Misrepresentation of Critical Information",
                                    "The software presents misleading or incorrect information in the user interface, which can cause users to make incorrect or insecure decisions."
                                ));
                        // --- Added missing CWEs ---
                        CWE_INFOS.put("CWE-668", new CweInfo(
                            "Exposure of Resource to Wrong Sphere",
                            "The software exposes a resource to the wrong control sphere, providing unintended actors with inappropriate access to the resource. This can lead to information disclosure, modification, or destruction."
                        ));
                        CWE_INFOS.put("CWE-190", new CweInfo(
                            "Integer Overflow or Wraparound",
                            "The software performs a calculation that can produce an integer overflow or wraparound, leading to unexpected results, memory corruption, or security vulnerabilities."
                        ));
                        CWE_INFOS.put("CWE-119", new CweInfo(
                            "Improper Restriction of Operations within the Bounds of a Memory Buffer",
                            "The software performs operations on a memory buffer, but it can read from or write to a memory location that is outside of the intended boundary of the buffer. This can result in code execution, data corruption, or crashes."
                        ));
                        CWE_INFOS.put("CWE-416", new CweInfo(
                            "Use After Free",
                            "The software uses memory after it has been freed, which can lead to code execution, data corruption, or crashes."
                        ));
                        CWE_INFOS.put("CWE-693", new CweInfo(
                            "Protection Mechanism Failure",
                            "The software does not properly implement or fails to use a protection mechanism that is intended to enforce a security policy, such as authentication, access control, or encryption."
                        ));
                        CWE_INFOS.put("CWE-843", new CweInfo(
                            "Access of Resource Using Incompatible Type ('Type Confusion')",
                            "The software accesses a resource using a type that is incompatible with the resource's actual type, leading to unpredictable behavior or security vulnerabilities."
                        ));
                        CWE_INFOS.put("CWE-22", new CweInfo(
                            "Improper Limitation of a Pathname to a Restricted Directory ('Path Traversal')",
                            "The software does not properly restrict the path used for file access, allowing attackers to access files outside of the intended directory via path traversal sequences (e.g., '../')."
                        ));
                CWE_INFOS.put("CWE-942", new CweInfo(
                    "Permissive Cross-domain Policy with Untrusted Domains",
                    "The software's cross-domain policy is overly permissive, allowing access from untrusted or arbitrary domains. This can enable attackers to bypass security restrictions and access sensitive resources or APIs from malicious sites."
                ));
                CWE_INFOS.put("CWE-1332", new CweInfo(
                    "Inefficient Regular Expression Complexity",
                    "The software uses regular expressions that are inefficiently constructed, leading to excessive backtracking or high computational complexity. This can result in performance degradation or denial of service (ReDoS) if an attacker provides specially crafted input."
                ));
                CWE_INFOS.put("CWE-1341", new CweInfo(
                    "Multiple Releases of Same Resource or Handle",
                    "The software releases or closes a resource, such as a file or memory handle, more than once. This can lead to undefined behavior, resource leaks, or security vulnerabilities if the resource is reused or accessed after being released."
                ));
                CWE_INFOS.put("CWE-908", new CweInfo(
                    "Use of Uninitialized Resource",
                    "The software uses a resource, such as a variable, object, or memory, before it has been properly initialized. This can lead to unpredictable behavior, crashes, or security vulnerabilities due to the use of unintended values."
                ));
                CWE_INFOS.put("CWE-1275", new CweInfo(
                    "Sensitive Cookie with Improper SameSite Attribute",
                    "The software sets a sensitive cookie without using the SameSite attribute or with an improper value, increasing the risk of cross-site request forgery (CSRF) and information leakage."
                ));
                CWE_INFOS.put("CWE-264", new CweInfo(
                    "Permissions, Privileges, and Access Controls (Obsolete)",
                    "This CWE is obsolete and has been replaced by more specific CWEs. It previously referred to issues where the software did not properly restrict permissions, privileges, or access controls, potentially allowing unauthorized actions."
                ));
                CWE_INFOS.put("CWE-1260", new CweInfo(
                    "Improper Origin Validation",
                    "The software does not properly validate the origin of a request, message, or data, allowing attackers to bypass security controls or perform unauthorized actions by spoofing trusted origins."
                ));
                CWE_INFOS.put("CWE-178", new CweInfo(
                    "Improper Handling of Case Sensitivity",
                    "The software does not properly handle the case sensitivity of identifiers, file names, or other data, which can lead to security bypasses, inconsistent behavior, or information disclosure."
                ));
                CWE_INFOS.put("CWE-59", new CweInfo(
                    "Improper Link Resolution Before File Access ('Link Following')",
                    "The software follows symbolic links or shortcuts before performing security checks or file operations, potentially allowing attackers to access or modify unintended files."
                ));
        // Top 25 Most Dangerous Software Weaknesses
        CWE_INFOS.put("CWE-787", new CweInfo(
            "Out-of-bounds Write",
            "A write operation which exceeds the boundary of the intended buffer. This can result in code execution, corruption of data, or system crashes."
        ));
        CWE_INFOS.put("CWE-79", new CweInfo(
            "Cross-site Scripting (XSS)",
            "The software does not neutralize or incorrectly neutralizes user-controllable input before it is placed in output that is used as a web page that is served to other users. This can allow attackers to execute scripts in the victim's browser, steal cookies, or perform actions on behalf of the user."
        ));
        CWE_INFOS.put("CWE-89", new CweInfo(
            "SQL Injection",
            "The software constructs all or part of an SQL command using externally-influenced input from an upstream component, but it does not neutralize or incorrectly neutralizes special elements that could modify the intended SQL command. This can allow attackers to execute arbitrary SQL code, read or modify database contents, or escalate privileges."
        ));
        CWE_INFOS.put("CWE-20", new CweInfo(
            "Improper Input Validation",
            "The product does not validate or incorrectly validates input that can affect the control flow or data flow of a program. This can lead to unexpected behavior, security vulnerabilities, or system compromise."
        ));
        CWE_INFOS.put("CWE-125", new CweInfo(
            "Out-of-bounds Read",
            "The software reads data past the end, or before the beginning, of the intended buffer. This can result in information disclosure, crashes, or other unintended behavior."
        ));
        // ... (compléter pour les autres CWE)
        CWE_INFOS.put("NVD-CWE-Other", new CweInfo(
            "Other",
            "A weakness that does not fit into any other defined CWE category."
        ));
        
        // Additional Common CWEs
                    CWE_INFOS.put("CWE-94", new CweInfo(
                        "Code Injection",
                        "Improper Control of Generation of Code ('Code Injection'): The software generates code using externally-influenced input without proper validation, allowing attackers to inject and execute arbitrary code."
                    ));
                    CWE_INFOS.put("CWE-918", new CweInfo(
                        "Server-Side Request Forgery (SSRF)",
                        "The software can be tricked into making requests to unintended locations, potentially exposing internal systems or sensitive data."
                    ));
                    CWE_INFOS.put("CWE-269", new CweInfo(
                        "Improper Privilege Management",
                        "The software does not properly assign, manage, or restrict privileges for users or processes, potentially allowing unauthorized actions."
                    ));
                    CWE_INFOS.put("CWE-863", new CweInfo(
                        "Incorrect Authorization",
                        "The software incorrectly authorizes users, allowing access to resources or actions that should be restricted."
                    ));
                    CWE_INFOS.put("CWE-426", new CweInfo(
                        "Untrusted Search Path",
                        "The software searches for resources or executables in directories that may be controlled by untrusted users, leading to execution of malicious code."
                    ));
                    CWE_INFOS.put("CWE-284", new CweInfo(
                        "Improper Access Control",
                        "The software does not restrict or incorrectly restricts access to resources, allowing unauthorized users to access sensitive data or functions."
                    ));
                    CWE_INFOS.put("CWE-295", new CweInfo(
                        "Improper Certificate Validation",
                        "The software does not properly validate certificates, allowing attackers to spoof trusted entities and intercept sensitive data."
                    ));
                    CWE_INFOS.put("CWE-327", new CweInfo(
                        "Use of a Broken or Risky Cryptographic Algorithm",
                        "The software uses cryptographic algorithms that are known to be insecure, making it easier for attackers to compromise encrypted data."
                    ));
                    CWE_INFOS.put("CWE-362", new CweInfo(
                        "Race Condition",
                        "Concurrent Execution using Shared Resource with Improper Synchronization ('Race Condition'): The software does not properly synchronize concurrent operations, leading to unexpected behavior or security vulnerabilities."
                    ));
                    CWE_INFOS.put("CWE-400", new CweInfo(
                        "Uncontrolled Resource Consumption",
                        "The software does not properly control the allocation and maintenance of resources, leading to resource exhaustion and denial of service."
                    ));
                    CWE_INFOS.put("CWE-772", new CweInfo(
                        "Missing Release of Resource after Effective Lifetime",
                        "The software does not release resources after they are no longer needed, leading to resource leaks and potential denial of service."
                    ));
                    CWE_INFOS.put("CWE-770", new CweInfo(
                        "Allocation of Resources Without Limits or Throttling",
                        "The software does not limit resource allocation, allowing attackers to consume excessive resources and degrade system performance."
                    ));
                    CWE_INFOS.put("CWE-601", new CweInfo(
                        "Open Redirect",
                        "URL Redirection to Untrusted Site ('Open Redirect'): The software redirects users to untrusted sites, potentially enabling phishing or malware attacks."
                    ));
                    CWE_INFOS.put("CWE-532", new CweInfo(
                        "Insertion of Sensitive Information into Log File",
                        "The software logs sensitive information, such as passwords or cryptographic keys, which can be accessed by unauthorized users."
                    ));
                    CWE_INFOS.put("CWE-77", new CweInfo(
                        "Command Injection",
                        "Improper Neutralization of Special Elements used in a Command ('Command Injection'): The software constructs commands using untrusted input, allowing attackers to execute arbitrary commands."
                    ));
                    CWE_INFOS.put("CWE-434", new CweInfo(
                        "Unrestricted Upload of File with Dangerous Type",
                        "The software allows the upload of files with dangerous types, which can be executed or processed in a way that compromises the system."
                    ));
                    CWE_INFOS.put("CWE-276", new CweInfo(
                        "Incorrect Default Permissions",
                        "The software assigns default permissions that are too permissive, allowing unauthorized access to resources."
                    ));
                    CWE_INFOS.put("CWE-732", new CweInfo(
                        "Incorrect Permission Assignment for Critical Resource",
                        "The software assigns incorrect permissions to critical resources, allowing unauthorized users to access or modify them."
                    ));
   

    }

    public CweInfo getCweInfo(String cweId) {
        if (cweId == null || cweId.trim().isEmpty()) {
            return null;
        }
        String normalizedCweId = cweId.trim().toUpperCase();
        if (!normalizedCweId.startsWith("CWE-")) {
            normalizedCweId = "CWE-" + normalizedCweId;
        }
        return CWE_INFOS.get(normalizedCweId);
    }

    // For backward compatibility (returns full description)
    public String getCweDescription(String cweId) {
        CweInfo info = getCweInfo(cweId);
        return info != null ? info.description : "";
    }
}
