import static com.kms.katalon.core.checkpoint.CheckpointFactory.findCheckpoint
import static com.kms.katalon.core.testcase.TestCaseFactory.findTestCase
import static com.kms.katalon.core.testdata.TestDataFactory.findTestData
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import static com.kms.katalon.core.testobject.ObjectRepository.findWindowsObject
import com.kms.katalon.core.checkpoint.Checkpoint as Checkpoint
import com.kms.katalon.core.cucumber.keyword.CucumberBuiltinKeywords as CucumberKW
import com.kms.katalon.core.mobile.keyword.MobileBuiltInKeywords as Mobile
import com.kms.katalon.core.model.FailureHandling as FailureHandling
import com.kms.katalon.core.testcase.TestCase as TestCase
import com.kms.katalon.core.testdata.TestData as TestData
import com.kms.katalon.core.testng.keyword.TestNGBuiltinKeywords as TestNGKW
import com.kms.katalon.core.testobject.TestObject as TestObject
import com.kms.katalon.core.webservice.keyword.WSBuiltInKeywords as WS
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.windows.keyword.WindowsBuiltinKeywords as Windows
import internal.GlobalVariable as GlobalVariable
import org.openqa.selenium.Keys as Keys

WebUI.callTestCase(findTestCase('Steps/Login_Logout and SignUp/Login with email and password'), [('email') : 'E2E1762357@ncc.asia'
        , ('password') : 'E2E1762357'], FailureHandling.STOP_ON_FAILURE)

WebUI.click(findTestObject('Channel Message/Send emoji, sticker, GIF/Page_Mezon/div_channel T'))

WebUI.click(findTestObject('Channel Message/Edit, Reply, Forward, Copy, Delete Message/span_private'))

WebUI.mouseOver(findTestObject('Channel Message/Edit, Reply, Forward, Copy, Delete Message/div_private_sent mes'))

WebUI.click(findTestObject('Channel Message/Edit, Reply, Forward, Copy, Delete Message/div_private_options'))

WebUI.click(findTestObject('Channel Message/Edit, Reply, Forward, Copy, Delete Message/div_private_reply'))

WebUI.verifyElementVisible(findTestObject('Channel Message/Edit, Reply, Forward, Copy, Delete Message/div_private_replying to'))

WebUI.setText(findTestObject('Channel Message/Edit, Reply, Forward, Copy, Delete Message/div_private_textarea'), 'mezon')

WebUI.sendKeys(findTestObject('Channel Message/Edit, Reply, Forward, Copy, Delete Message/div_private_textarea'), Keys.chord(
        Keys.ENTER))

WebUI.verifyElementVisible(findTestObject('Channel Message/Edit, Reply, Forward, Copy, Delete Message/div_replyed'))

WebUI.verifyElementText(findTestObject('Channel Message/Edit, Reply, Forward, Copy, Delete Message/span_mezon'), 'mezon')

