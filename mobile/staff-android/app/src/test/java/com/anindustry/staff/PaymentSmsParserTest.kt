package com.anindustry.staff

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertNotNull
import org.junit.Test

class PaymentSmsParserTest {
    @Test
    fun acceptsClearEbirrIncomingPayment() {
        val payment = PaymentSmsParser.parse(
            "E-Birr",
            "You received ETB 590.00. Transaction ID: EB12345678",
            "ebirr-account",
            "cbe-account"
        )
        assertNotNull(payment)
        assertEquals("EBIRR", payment?.provider)
        assertEquals(590.0, payment?.amount ?: 0.0, 0.001)
        assertEquals("ebirr-account", payment?.accountId)
    }

    @Test
    fun rejectsOtpEvenWhenProviderAndAmountAppear() {
        assertNull(PaymentSmsParser.parse(
            "CBE",
            "Your OTP is 123456 to approve ETB 590.00. Do not share this PIN.",
            "ebirr-account",
            "cbe-account"
        ))
    }

    @Test
    fun rejectsUnrecognisedPersonalMessage() {
        assertNull(PaymentSmsParser.parse(
            "+251900000000",
            "I received the 590 birr, thank you",
            "ebirr-account",
            "cbe-account"
        ))
    }

    @Test
    fun rejectsPaymentWhenMappedAccountIsMissing() {
        assertNull(PaymentSmsParser.parse(
            "E-Birr",
            "You received 590 ETB, reference EB12345678",
            "",
            "cbe-account"
        ))
    }
}
