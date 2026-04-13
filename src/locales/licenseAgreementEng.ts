import {
  createHeader, createLink, createListItem, createListItemText,
  createParagraph, createParagraphList,
  createSubHeader, createText,
  createTextParagraph,
  FormatText
} from "@/src/components/FormatTextView";

export function getLicenseAgreementEng(): FormatText {
  return {
    headers:[
      createHeader('License Agreement',
        [
          createSubHeader('1 General provisions of the License Agreement',
            [
              createTextParagraph('The mobile app “Bank of Russia Banknotes” (hereinafter the Application) is provided free of charge by the Bank of Russia (hereinafter the Rightholder). The Application is distributed through the official app stores of mobile platforms.'),
              createTextParagraph('Any intellectual property rights relating to the Application belong to the Rightholder. This License Agreement (hereinafter the Agreement) cannot be considered as a refusal of the Rightholder from its intellectual property rights in any jurisdiction.'),
              createTextParagraph('The Agreement establishes the requirements, conditions and rules of use by any person (hereinafter the User) of the Application and its capabilities.'),
              createTextParagraph('This Agreement is an offer as defined by Article 435 of the Civil Code of the Russian Federation. Any use of the Application means full and unconditional acceptance by the User of all the terms of this Agreement. By copying the Application, installing it on a mobile device (smartphone or tablet) or using the Application in any other manner the User expresses his/her full and unconditional consent to all the requirements, terms and conditions of the Agreement. The use of the Application is acceptable exclusively on the terms of this Agreement.'),
              createTextParagraph('If the User does not accept the terms of the Agreement in full and has no intention to observe them, the User has no right to use the Application for any purpose. The use of the Application with infringement or non-fulfillment of any of the conditions, requirements or terms of the Agreement is prohibited.'),
              createTextParagraph('Using this Application, the User confirms that he/she is informed about the risks of using camera-based applications while driving, walking and in other situations stemming from distraction of attention or disorientation from real situations.'),
              createTextParagraph('This Agreement shall come into force from the moment when the User accepts conditions while running the Application for the first time and shall be valid for an unlimited period of time.'),
              createTextParagraph('The Rightholder grants to the User, and the User accepts a limited non-commercial personal non-exclusive license not transferable and with no right to sublicense to use the Application on a mobile device (smartphone or tablet) which the User owns or disposes of. This license is transferred only on the terms and conditions set forth in the text of this Agreement. Violation by the User of the requirements, conditions, and rules of this Agreement automatically leads to the cancellation of the License and the Agreement.'),
              createParagraphList('The User has the right to:',[
                createListItemText('•', 'use the Application free of charge for personal use not connected with obtaining commercial profits;'),
                createListItemText('•','contact the Rightholder in order to resolve issues related to the use of the Application through the mobile application page in the Google Play official app stores for Android platform mobile devices or the App Store for iOS mobile devices.')
              ]),
              createParagraphList('The User has no right to copy and distribute the Application or its parts for commercial purposes without the written consent of the Rightholder. Without the prior written consent of the Rightholder, the User has no right to:', [
                createListItemText('•','modify in any way, integrate into other software or create a revised version of any part of the Application;'),
                createListItemText('•','copy and distribute the Application in the interests of third parties;'),
                createListItemText('•','decompile, process the Application, attempt to acquire the initial code or the Content of the Application (any information-significant content of the information resource, including in the form of texts, graphic files, photos, videos, audios) (hereinafter the Content).'),
              ]),
              createTextParagraph('No Content can be copied (reproduced), processed, distributed, published, downloaded, transmitted, sold or otherwise used in whole or in part without the prior permission of the Rightholder, unless the Rightholder has explicitly expressed his/her consent to the free use of the material by any person, except for the cases established by the current legislation of the Russian Federation.'),
              createTextParagraph('The use of the Content, to which the User has access only for personal non-commercial use, is allowed provided that all the copyrights or other notices of authorship are retained, the name of the Rightholder remains unchanged, and the product remains unchanged.'),
              createTextParagraph(`The Application is provided without any warranty expressed or implied with respect to the error-free and troubleproof operation of the Application or its individual components and functions. The Rightholder does not guarantee that the Application will meet the User's expectations.`),
              createTextParagraph('Under no circumstances will the Rightholder be liable to the User or any third parties for any direct, indirect, unintentional damage, including lost profits or lost data, damage to honor, dignity or business reputation caused by the use or inability to use the Application.'),
              createTextParagraph('The output data of the Application corresponds to the age rating “13+” for Android-devices and “4+” for iOS-devices.'),
              createTextParagraph('The Rightholder has no obligation to provide support (including when the User appeals through the mobile application’s page in official app stores), maintenance, updates, modifications and new versions of the Application in accordance with this Agreement. If an update for the Application is put out, the new version is installed on a mobile device (smartphone or tablet) via the official application stores of mobile platform. This Agreement applies to all updates and new versions of the Application. By agreeing to the installation of an update or a new version of the Application, the User accepts the terms of this Agreement for the corresponding updates and new versions of the Application if the update and the installation of a new version are not accompanied by another Agreement.'),
              createParagraph([
                createText('The Rightholder reserves the right to make changes to the Agreement, which comes into effect from the moment of publication. The text of the current version of the Agreement is available on '),
                createLink('the Bank of Russia website', 'CbrLicenseLinkEng'),
                createText('.')
              ]),
              createTextParagraph('The Rightholder does not accept counteroffers from the User regarding changes to this Agreement.'),
              createTextParagraph('In the event of any dispute or disagreement arising out of the implementation of this Agreement, the User and the Rightholder will make every effort to resolve them by negotiations. In the event when disputes are not resolved by negotiations, disputes shall be resolved in the appropriate competent court at the location of the Bank of Russia in accordance with the current legislation of the Russian Federation.'),
            ]),
          createSubHeader('2 Privacy Policy of the User',
            [
              createParagraphList('The Rightholder guarantees that the Application does not collect, transmit or process any personal data of the User. If an Application error occurs, a technical report is generated containing the following information regarding the device used:', [
                createListItemText('•','model of the mobile device;'),
                createListItemText('•','mobile platform installed on the mobile device.'),
              ]),
              createTextParagraph(`The technical report is sent in accordance with the rules of a mobile platform installed on the User's device.`),
              createTextParagraph('The User’s feedback posted in the official app stores of mobile platforms is not considered to be confidential information and can be used by the Rightholder without restrictions.')
            ])
        ]
      ),
      createHeader('Operating conditions',
        [
          createSubHeader('1 Identification of the denomination and the year of a banknote (or its modification)',
            [
              createTextParagraph('The Application provides information on the security features of banknotes currently in circulation and allows to obtain information about the denomination and the year of a banknote (or its modification), and its security features based on the image corresponding to a Bank of Russia note.'),

              createParagraphList('The term “recognition” in the Application means the identification of the denomination and the year of a banknote (or its modification) based on the image corresponding to a Bank of Russia note in circulation. The probability of correct identification of the year of the banknote (or its modification) is not less than 90%, provided that the following conditions are followed:', [
                createListItem('a)',[
                  createText('The Bank of Russia note presented to the recognition system is not wornout. Criteria for determination of banknotes as unfit are posted on the official '),
                  createLink('website of the Bank of Russia', 'CbrUnfitLinkEng'),
                  createText('.')
                ]),
                createListItemText('b)','The illumination intensity of the surface of the banknote is not less than 750 lux.'),
                createListItemText('c)','Use of a mobile device with minimum technical requirements given in the clause 4.'),
              ]),
              createTextParagraph('The Application does not identify banknotes’ modifications of 2001. The recognition result for banknote modifications of 2001 contains information about the denomination of a banknote and the year of modification in the following wording: “banknote of 1997 (and modification of 2001)”.'),
              createTextParagraph('When automatic recognition is performed on the reverse side of a 10 ruble banknote, a message is displayed containing banknote denomination and requiring to retry the automatic recognition on the face of the banknote to determine the year of the banknote (or its modification).'),
            ]),
          createSubHeader('2 Determination of some security features presence on a banknote', [
            createTextParagraph('The Application has the functionality of determination of some security features presence on a banknote for the 1000 ruble banknotes, modification of 2010, the 2000 ruble banknotes of 2017 and the 5000 ruble banknotes, modification of 2010. The Application does not guarantee the verification of authenticity of a banknote.'),
            createParagraphList('The function of determination of some security features presence on the 1000 ruble banknotes, modification of 2010, the 2000 ruble banknotes of 2017 and the 5000 ruble banknotes, modification of 2010 provides the following efficiency indicators:', [
              createListItemText('•','FMR (False Match Rate) ≤ 0.025;'),
              createListItemText('•','FNMR (False Non-Match Rate) ≤ 0.10 for banknotes of the indicated denominations having negligible soiling and mechanical damage;'),
              createListItemText('•','FNMR (False Non-Match Rate) ≤ 0.03 for banknotes of specified denominations of the Goznak quality (fit banknotes with no traces of soiling as well as mechanical damage).'),
            ]),
            createParagraphList('Achievement of these efficiency indicators is possible under the following conditions:', [
              createListItem('a)',[
                createText('The Bank of Russia note presented to the recognition system is not wornout. Criteria for determination of banknotes as unfit are posted on the official '),
                createLink('website of the Bank of Russia', 'CbrUnfitLinkEng'),
                createText('.')
              ]),
              createListItemText('b)','The illumination intensity of the surface of the banknote is not less than 750 lux.'),
              createListItemText('c)','Use of a mobile device with recommended technical requirements given in the clause 4.'),
            ]),
          ]),
          createSubHeader('3 Permissions required for correct functioning of the Application', [
            createParagraphList('For correct functioning of the Application when installing and running the Application the following permissions are required:', [
              createListItemText('•','access to the camera;'),
              createListItemText('•','access to multimedia files on the device;'),
              createListItemText('•','receiving of the push-notifications;'),
              createListItemText('•','access to the Internet;'),
              createListItemText('•','access to vibration.'),
            ]),

            createTextParagraph('Access to the video camera of the mobile device of the User is required to analyze the visual image of a banknote.'),
            createTextParagraph('Access to multimedia files on the device is required to store and display the content of the Application.'),
            createTextParagraph(`Permission to receive push-notifications allows the User to receive messages with relevant news on the User's mobile device.`),
            createParagraphList('Internet access is required:', [
              createListItemText('•','for the transfer on the hyperlinks placed in the Application. To make the transfer, the Application interacts with the web-browser installed on the User\'s mobile device;'),
              createListItemText('•','to set a rating for the Application in the official app stores of mobile platforms. This leads to the Application page in the official app store (depending on the operating system version of the User\'s mobile device, the rating can be set directly in the Application);'),
              createListItemText('•','for reviewing of the push-notifications. Sending of the push-notifications is carried out using «Firebase Cloud Messaging» service.'),
            ]),
            createTextParagraph('Access to vibration is used to demonstrate security features that are checked by physical contact.')
          ]),
          createSubHeader('4 Technical requirements for mobile devices', [
            createParagraphList('Minimum technical requirements for mobile devices (smartphones or tablets) to run the Application are:', [
              createListItemText('a)','4-core processor with frequency of 1 GHz for Android-devices, and a 2-core processor with frequency of 1 GHz for Apple-devices;'),
              createListItemText('b)','RAM (Random Access Memory): 1 GB and higher;'),
              createListItemText('c)','free permanent memory capacity on a device: not less than 300 MB;'),
              createListItemText('d)','camera resolution not less than 5 mp and autofocus for the function of identification of the denomination and the year of a banknote (or its modification) / camera resolution not less than 8 mp with autofocus and flash for the function of determination of some security features presence on a banknote;'),
              createListItemText('e)','screen resolution: 800х480 and higher;'),
              createListItemText('f)','accelerometer;'),
              createListItemText('g)','Android operating system version 5 or higher, iOS version 9 or higher.'),
            ]),
            createParagraphList('Recommended technical requirements for mobile devices (smartphones or tablets) to run the Application including determination of some security features presence on a banknote with given efficiency indicators are:', [
              createListItemText('a)','8-core processor with frequency of 1.5 GHz for Android-devices, and a 2-core processor with  frequency of 1.3 GHz for Apple-devices;'),
              createListItemText('b)','RAM: 2 GB or higher;'),
              createListItemText('c)','free permanent memory capacity on a device: not less than 300 MB;'),
              createListItemText('d)','camera resolution not less than 12 mp with autofocus and flash;'),
              createListItemText('e)','screen resolution: 800х480 and higher;'),
              createListItemText('f)','accelerometer;'),
              createListItemText('g)','magnetometer (compass);'),
              createListItemText('h)','Android operating system version 7 or higher, iOS version 11 or higher.'),
            ]),
            createTextParagraph('To provide an optimal size of control elements of the Application it is recommended to use a mobile device with a touch screen diagonal not less than 4.5”.'),
            createTextParagraph('In case of excessive heating of the mobile device, it is recommended to stop the Application until the mobile device cools down in order to avoid incorrect functioning of the Application.'),
            createTextParagraph('The User bears full responsibility for the functioning of the Application and the mobile device in whole if technical characteristics of the mobile device on which the mobile Application is installed are lower than minimum technical requirements.')
          ])
        ]
      )
    ]
  }
}