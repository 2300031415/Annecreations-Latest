"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function PurpletreeSmsForm() {
  const [activeTab, setActiveTab] = useState("sms-api-url")

  return (
    <Card className="mt-6 border border-gray-200 bg-white shadow-md">
      <CardContent className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="module-status">Status</Label>
            <Select defaultValue="enabled">
              <SelectTrigger id="module-status" className="border-gray-300">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Change License Key</Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 bg-gray-100">
            <TabsTrigger value="sms-api-url" className="data-[state=active]:bg-white">
              SMS API URL
            </TabsTrigger>
            <TabsTrigger value="bulk-sms" className="data-[state=active]:bg-white">
              Bulk SMS
            </TabsTrigger>
            <TabsTrigger value="order-sms" className="data-[state=active]:bg-white">
              Order SMS
            </TabsTrigger>
            <TabsTrigger value="order-status-sms" className="data-[state=active]:bg-white">
              Order Status SMS
            </TabsTrigger>
            <TabsTrigger value="sms-verification" className="data-[state=active]:bg-white">
              SMS Verification
            </TabsTrigger>
            <TabsTrigger value="customer-login" className="data-[state=active]:bg-white">
              Customer Login
            </TabsTrigger>
            <TabsTrigger value="test-sms" className="data-[state=active]:bg-white">
              Test SMS
            </TabsTrigger>
          </TabsList>

          {/* SMS API URL Tab */}
          <TabsContent value="sms-api-url" className="mt-6 space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sms-api-url">SMS API URL</Label>
                <Input
                  id="sms-api-url"
                  placeholder="https://www.fast2sms.com/dev/bulkV2?authorization=kzSXV4mQosuFKw5COZai8cLdPW7..."
                  className="border-gray-300"
                />
                <p className="text-sm text-gray-500">
                  Please enter the SMS API provided by sms provider. Note use these variables:_MOB_(for mobile number),
                  and _TEXT_(for SMS).
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="http-method">HTTP METHOD</Label>
                <Select defaultValue="get">
                  <SelectTrigger id="http-method" className="border-gray-300">
                    <SelectValue placeholder="Select HTTP method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="get">GET</SelectItem>
                    <SelectItem value="post">POST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Bulk SMS Tab */}
          <TabsContent value="bulk-sms" className="mt-6 space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bulk-sms-status">Status</Label>
                <Select defaultValue="enabled">
                  <SelectTrigger id="bulk-sms-status" className="border-gray-300">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enabled">Enabled</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Order SMS Tab */}
          <TabsContent value="order-sms" className="mt-6 space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="order-sms-status">Status</Label>
                <Select defaultValue="disabled">
                  <SelectTrigger id="order-sms-status" className="border-gray-300">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enabled">Enabled</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="order-sms-template">Template</Label>
                <Textarea
                  id="order-sms-template"
                  placeholder="Hello _NAME_, Your order no #_ORDERID_ has been received for amount _AMOUNT_."
                  className="min-h-[100px] resize-y border-gray-300"
                />
                <p className="text-sm text-gray-500">
                  Note use these variables:_NAME_(for Customer name),_ORDERID_(for Order id),_AMOUNT_(for Amount).
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Order Status SMS Tab */}
          <TabsContent value="order-status-sms" className="mt-6">
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="canceled">
                <AccordionTrigger className="px-4 py-2 hover:bg-gray-50">Canceled</AccordionTrigger>
                <AccordionContent className="px-4 py-2">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="canceled-status">Status</Label>
                      <Select defaultValue="disabled">
                        <SelectTrigger id="canceled-status" className="border-gray-300">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="canceled-template">Template</Label>
                      <Textarea
                        id="canceled-template"
                        placeholder="Hello _NAME_, Your order no #_ORDERID_ has been Canceled._COMMENT_"
                        className="min-h-[100px] resize-y border-gray-300"
                      />
                      <p className="text-sm text-gray-500">
                        Note use these variables:_NAME_(for Customer name),_ORDERID_(for Order id), and _COMMENT_(for
                        Comment)
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="canceled-reversal">
                <AccordionTrigger className="px-4 py-2 hover:bg-gray-50">Canceled Reversal</AccordionTrigger>
                <AccordionContent className="px-4 py-2">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="canceled-reversal-status">Status</Label>
                      <Select defaultValue="disabled">
                        <SelectTrigger id="canceled-reversal-status" className="border-gray-300">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="canceled-reversal-template">Template</Label>
                      <Textarea
                        id="canceled-reversal-template"
                        placeholder="Hello _NAME_, Your order no #_ORDERID_ has been Canceled Reversal._COMMENT_"
                        className="min-h-[100px] resize-y border-gray-300"
                      />
                      <p className="text-sm text-gray-500">
                        Note use these variables:_NAME_(for Customer name),_ORDERID_(for Order id), and _COMMENT_(for
                        Comment)
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="chargeback">
                <AccordionTrigger className="px-4 py-2 hover:bg-gray-50">Chargeback</AccordionTrigger>
                <AccordionContent className="px-4 py-2">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="chargeback-status">Status</Label>
                      <Select defaultValue="disabled">
                        <SelectTrigger id="chargeback-status" className="border-gray-300">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="chargeback-template">Template</Label>
                      <Textarea
                        id="chargeback-template"
                        placeholder="Hello _NAME_, Your order no #_ORDERID_ has been Chargeback._COMMENT_"
                        className="min-h-[100px] resize-y border-gray-300"
                      />
                      <p className="text-sm text-gray-500">
                        Note use these variables:_NAME_(for Customer name),_ORDERID_(for Order id), and _COMMENT_(for
                        Comment)
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Add more order statuses as needed */}
              <AccordionItem value="complete">
                <AccordionTrigger className="px-4 py-2 hover:bg-gray-50">Complete</AccordionTrigger>
                <AccordionContent className="px-4 py-2">{/* Similar content as above */}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="denied">
                <AccordionTrigger className="px-4 py-2 hover:bg-gray-50">Denied</AccordionTrigger>
                <AccordionContent className="px-4 py-2">{/* Similar content as above */}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="expired">
                <AccordionTrigger className="px-4 py-2 hover:bg-gray-50">Expired</AccordionTrigger>
                <AccordionContent className="px-4 py-2">{/* Similar content as above */}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="failed">
                <AccordionTrigger className="px-4 py-2 hover:bg-gray-50">Failed</AccordionTrigger>
                <AccordionContent className="px-4 py-2">{/* Similar content as above */}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="pending">
                <AccordionTrigger className="px-4 py-2 hover:bg-gray-50">Pending</AccordionTrigger>
                <AccordionContent className="px-4 py-2">{/* Similar content as above */}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="processed">
                <AccordionTrigger className="px-4 py-2 hover:bg-gray-50">Processed</AccordionTrigger>
                <AccordionContent className="px-4 py-2">{/* Similar content as above */}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="processing">
                <AccordionTrigger className="px-4 py-2 hover:bg-gray-50">Processing</AccordionTrigger>
                <AccordionContent className="px-4 py-2">{/* Similar content as above */}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="refunded">
                <AccordionTrigger className="px-4 py-2 hover:bg-gray-50">Refunded</AccordionTrigger>
                <AccordionContent className="px-4 py-2">{/* Similar content as above */}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="reversed">
                <AccordionTrigger className="px-4 py-2 hover:bg-gray-50">Reversed</AccordionTrigger>
                <AccordionContent className="px-4 py-2">{/* Similar content as above */}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="shipped">
                <AccordionTrigger className="px-4 py-2 hover:bg-gray-50">Shipped</AccordionTrigger>
                <AccordionContent className="px-4 py-2">{/* Similar content as above */}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="voided">
                <AccordionTrigger className="px-4 py-2 hover:bg-gray-50">Voided</AccordionTrigger>
                <AccordionContent className="px-4 py-2">{/* Similar content as above */}</AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          {/* SMS Verification Tab */}
          <TabsContent value="sms-verification" className="mt-6 space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="verification-checkout">Verification on checkout</Label>
                <Select defaultValue="no">
                  <SelectTrigger id="verification-checkout" className="border-gray-300">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="verification-registration">Verification on registration</Label>
                <Select defaultValue="yes">
                  <SelectTrigger id="verification-registration" className="border-gray-300">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="verification-template">Template</Label>
                <Textarea
                  id="verification-template"
                  placeholder="_OTP_"
                  className="min-h-[100px] resize-y border-gray-300"
                />
                <p className="text-sm text-gray-500">
                  Note the variables _OTP_:- is for OTP which sends to mobile and mail.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="verification-for">Verification for</Label>
                <Select defaultValue="mobile-email">
                  <SelectTrigger id="verification-for" className="border-gray-300">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile-only">Mobile Only</SelectItem>
                    <SelectItem value="email-only">E-Mail Only</SelectItem>
                    <SelectItem value="mobile-email">Mobile And E-Mail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Customer Login Tab */}
          <TabsContent value="customer-login" className="mt-6 space-y-4">
            <div className="grid gap-4">
              <RadioGroup defaultValue="normal" className="space-y-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="normal-login" />
                  <Label htmlFor="normal-login">Normal login</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mobile-otp" id="mobile-otp" />
                  <Label htmlFor="mobile-otp">Login with mobile number using OTP SMS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email-otp" id="email-otp" />
                  <Label htmlFor="email-otp">Login with email id using OTP verification</Label>
                </div>
              </RadioGroup>

              <div className="grid gap-2">
                <Label htmlFor="login-template">Template</Label>
                <Textarea id="login-template" placeholder="_CODE_" className="min-h-[100px] resize-y border-gray-300" />
              </div>
            </div>
          </TabsContent>

          {/* Test SMS Tab */}
          <TabsContent value="test-sms" className="mt-6 space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="test-mobile">Enter Mobile No.</Label>
                <Input id="test-mobile" placeholder="Enter mobile number" className="border-gray-300" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="test-sms-text">Enter SMS Text</Label>
                <Input id="test-sms-text" placeholder="Enter SMS text" className="border-gray-300" />
              </div>

              <div>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Test</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
